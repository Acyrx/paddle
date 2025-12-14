import {
  CustomerCreatedEvent,
  CustomerUpdatedEvent,
  EventEntity,
  EventName,
  SubscriptionCreatedEvent,
  SubscriptionUpdatedEvent,
  TransactionCreatedEvent,
  TransactionUpdatedEvent,
} from '@paddle/paddle-node-sdk';
import { createClient } from '@/utils/supabase/server-internal';
import { getTokenLimitFromPriceId } from './get-token-limit';

export class ProcessWebhook {
  async processEvent(eventData: EventEntity) {
    switch (eventData.eventType) {
      case EventName.SubscriptionCreated:
      case EventName.SubscriptionUpdated:
        await this.updateSubscriptionData(eventData);
        break;
      case EventName.CustomerCreated:
      case EventName.CustomerUpdated:
        await this.updateCustomerData(eventData);
        break;
      case EventName.TransactionCreated:
      case EventName.TransactionUpdated:
        await this.updateTransactionData(eventData);
        break;
    }
  }

  private async updateSubscriptionData(eventData: SubscriptionCreatedEvent | SubscriptionUpdatedEvent) {
    const supabase = await createClient();
    const priceId = eventData.data.items[0].price?.id ?? '';

    // Update subscription
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .upsert({
        subscription_id: eventData.data.id,
        subscription_status: eventData.data.status,
        price_id: priceId,
        product_id: eventData.data.items[0].price?.productId ?? '',
        scheduled_change: eventData.data.scheduledChange?.effectiveAt,
        customer_id: eventData.data.customerId,
      })
      .select();

    if (subscriptionError) throw subscriptionError;

    // Update token limit for user based on subscription tier
    await this.updateTokenLimitForCustomer(eventData.data.customerId, priceId);
  }

  private async updateCustomerData(eventData: CustomerCreatedEvent | CustomerUpdatedEvent) {
    const supabase = await createClient();
    const { error } = await supabase
      .from('customers')
      .upsert({
        customer_id: eventData.data.id,
        email: eventData.data.email,
      })
      .select();

    if (error) throw error;
  }

  private async updateTransactionData(eventData: TransactionCreatedEvent | TransactionUpdatedEvent) {
    const supabase = await createClient();
    const transaction = eventData.data;

    // Get customer email to find user_id
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('email')
      .eq('customer_id', transaction.customerId)
      .single();

    if (customerError || !customerData) {
      console.error('Error fetching customer for transaction:', customerError);
      return;
    }

    // Get user_id from email using the database function
    const { data: userData, error: userError } = await supabase.rpc('get_user_id_from_email', {
      user_email: customerData.email,
    });

    if (userError) {
      console.error('Error getting user_id from email:', userError);
    }

    const userId = userData as string | null;

    // Store transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .upsert({
        transaction_id: transaction.id,
        user_id: userId,
        customer_id: transaction.customerId,
        subscription_id: transaction.subscriptionId ?? null,
        status: transaction.status,
        // amount: transaction.totals?.total ?? null,
        currency_code: transaction.currencyCode ?? null,
        billing_period: transaction.billingPeriod ? JSON.stringify(transaction.billingPeriod) : null,
        // price_id: transaction.items?.[0]?.priceId ?? null,
        // product_id: transaction.items?.[0]?.productId ?? null,
      })
      .select();

    if (transactionError) {
      console.error('Error storing transaction:', transactionError);
      throw transactionError;
    }
  }

  private async updateTokenLimitForCustomer(customerId: string, priceId: string) {
    const supabase = await createClient();

    // Get customer email
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('email')
      .eq('customer_id', customerId)
      .single();

    if (customerError || !customerData) {
      console.error('Error fetching customer for token limit update:', customerError);
      return;
    }

    // Get user_id from email
    const { data: userData, error: userError } = await supabase.rpc('get_user_id_from_email', {
      user_email: customerData.email,
    });

    if (userError || !userData) {
      console.error('Error getting user_id from email for token limit:', userError);
      return;
    }

    const userId = userData as string;
    const tokenLimit = getTokenLimitFromPriceId(priceId);
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Update or insert token_usage for current month
    const { error: tokenError } = await supabase
      .from('token_usage')
      .upsert(
        {
          user_id: userId,
          month: currentMonth,
          token_limit: tokenLimit,
          last_reset_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,month',
        },
      )
      .select();

    if (tokenError) {
      console.error('Error updating token limit:', tokenError);
      throw tokenError;
    }
  }
}
