declare module 'payable-ipg-js' {
  interface PayablePaymentOptions {
    checkValue: string;
    orderDescription: string;
    invoiceId: string;
    logoUrl: string;
    notifyUrl: string;
    returnUrl: string;
    merchantKey: string;
    customerFirstName: string;
    customerLastName: string;
    customerMobilePhone: string;
    customerEmail: string;
    billingAddressStreet: string;
    billingAddressCity: string;
    billingAddressCountry: string;
    amount: string;
    currencyCode: string;
    paymentType: string;
    isSaveCard?: string;
    customerRefNo?: string;
    doFirstPayment?: string;
    custom1?: string;
    custom2?: string;
  }

  export function payablePayment(options: PayablePaymentOptions, testMode: boolean): void;
}
