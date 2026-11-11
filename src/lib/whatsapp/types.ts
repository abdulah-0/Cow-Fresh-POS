/**
 * types.ts
 * Type definitions for Cow Fresh WhatsApp Integration (Green API Cloud)
 */

export type WhatsAppMessageKind = 'receipt' | 'delivery_update' | 'order_status' | 'payment_reminder' | 'text'

export interface WhatsAppSendInput {
    kind: WhatsAppMessageKind
    toPhone?: string
    customerId?: number
    payload: Record<string, any>
}

export interface WhatsAppSendResult {
    success: boolean
    idMessage?: string
    error?: string
    skippedReason?: string
}

export interface DeliveryNotificationData {
    customerName: string
    customerPhone: string
    orderNo?: string | number
    itemsSummary?: string
    totalAmount?: number | string
    riderName?: string
    riderPhone?: string
    deliveryTime?: string
    deliveryAddress?: string
}
