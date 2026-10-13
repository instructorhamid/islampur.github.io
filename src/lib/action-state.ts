export type ActionState = { ok: boolean; message: string; ts: number } | null;

export const success = (message = "সংরক্ষণ করা হয়েছে।"): ActionState => ({ ok: true, message, ts: Date.now() });
export const failure = (message = "দুঃখিত, একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।"): ActionState => ({ ok: false, message, ts: Date.now() });
