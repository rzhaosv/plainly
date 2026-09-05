import Purchases, { CustomerInfo, PurchasesPackage, LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

const RC_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
export const ENTITLEMENT = 'plus';
let configured = false;

export function configureBilling(appUserId?: string) {
  if (configured || Platform.OS !== 'ios' || !RC_IOS_KEY) return;
  try {
    Purchases.setLogLevel(LOG_LEVEL.ERROR);
    Purchases.configure({ apiKey: RC_IOS_KEY, appUserID: appUserId });
    configured = true;
  } catch {
    /* free mode */
  }
}
export function isPlus(info: CustomerInfo | null | undefined): boolean {
  return !!info && !!info.entitlements.active[ENTITLEMENT];
}
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!configured) return null;
  try { return await Purchases.getCustomerInfo(); } catch { return null; }
}
export function addPlusListener(cb: (v: boolean) => void): () => void {
  if (!configured) return () => {};
  const l = (info: CustomerInfo) => cb(isPlus(info));
  Purchases.addCustomerInfoUpdateListener(l);
  return () => Purchases.removeCustomerInfoUpdateListener(l);
}
const DEMO_PACKAGES = [
  { identifier: '$rc_annual', packageType: 'ANNUAL', product: { priceString: '$29.99' } },
  { identifier: '$rc_monthly', packageType: 'MONTHLY', product: { priceString: '$6.99' } },
] as unknown as PurchasesPackage[];
export async function getPackages(): Promise<PurchasesPackage[]> {
  if (Platform.OS === 'web') return DEMO_PACKAGES;
  if (!configured) return [];
  try { return (await Purchases.getOfferings()).current?.availablePackages ?? []; } catch { return []; }
}
export async function purchase(pkg: PurchasesPackage): Promise<boolean> {
  if (!configured) return false;
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return isPlus(customerInfo);
}
export async function restore(): Promise<boolean> {
  if (!configured) return false;
  return isPlus(await Purchases.restorePurchases());
}
export function isCancelledError(e: any): boolean {
  return !!e && (e.userCancelled === true || e.code === '1');
}
