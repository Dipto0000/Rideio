declare module 'sslcommerz-lts' {
  interface SSLCommerzInitData {
    total_amount: number;
    currency: string;
    tran_id: string;
    success_url: string;
    fail_url: string;
    cancel_url: string;
    ipn_url: string;
    shipping_method: string;
    product_name: string;
    product_category: string;
    product_profile: string;
    cus_name: string;
    cus_email: string;
    cus_add1: string;
    cus_add2?: string;
    cus_city: string;
    cus_state?: string;
    cus_postcode: string;
    cus_country: string;
    cus_phone: string;
    cus_fax?: string;
    ship_name: string;
    ship_add1: string;
    ship_add2?: string;
    ship_city: string;
    ship_state?: string;
    ship_postcode: string;
    ship_country: string;
    value_a?: string;
    value_b?: string;
    value_c?: string;
    value_d?: string;
  }

  interface SSLCommerzValidateData {
    val_id: string;
    store_id: string;
    store_passwd: string;
  }

  interface SSLCommerzTransactionQueryData {
    tran_id: string;
  }

  interface SSLCommerzSessionQueryData {
    sessionkey: string;
  }

  export default class SSLCommerzPayment {
    constructor(storeId: string, storePassword: string, isLive: boolean);
    init(data: SSLCommerzInitData): Promise<Record<string, any>>;
    validate(data: SSLCommerzValidateData): Promise<Record<string, any>>;
    transactionQueryByTransactionId(data: SSLCommerzTransactionQueryData): Promise<Record<string, any>>;
    transactionQueryBySessionId(data: SSLCommerzSessionQueryData): Promise<Record<string, any>>;
  }
}
