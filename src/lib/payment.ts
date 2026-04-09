import { supabase } from './supabase';

export const createStripePaymentIntent = async (amount: number, currency: string = 'vnd') => {
  // In a real app, this would be a Supabase Edge Function call
  // For demo/dev, we simulate the fetch
  console.log(`Creating Stripe PaymentIntent for ${amount} ${currency}`);
  
  // Simulation: return a mock client secret
  return {
    clientSecret: 'pi_mock_secret_' + Math.random().toString(36).substring(7),
    error: null
  };
};

export const createPayOSLink = async (amount: number, description: string) => {
  // Simulation of PayOS checkout link creation
  console.log(`Creating PayOS link for ${amount} - ${description}`);
  
  return {
    checkoutUrl: 'https://pay.payos.vn/m/test-link-' + Date.now(),
    error: null
  };
};

export const confirmPremiumPayment = async (userId: string, gateway: string, amount: number) => {
  try {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month premium

    // 1. Update Profile
    const { error: pErr } = await supabase!
      .from('profiles')
      .update({
        is_premium: true,
        premium_until: expiresAt.toISOString()
      })
      .eq('id', userId);

    if (pErr) throw pErr;

    // 2. Log Subscription
    const { error: sErr } = await supabase!
      .from('subscriptions')
      .insert([{
        user_id: userId,
        gateway,
        amount,
        status: 'completed',
        provider_ref: 'manual_' + Date.now()
      }]);

    if (sErr) throw sErr;

    return { success: true };
  } catch (error: any) {
    console.error('Payment confirmation error:', error);
    return { success: false, error: error.message };
  }
};
