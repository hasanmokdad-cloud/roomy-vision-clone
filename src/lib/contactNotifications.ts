export async function triggerContactEmailNotification(payload: {
  first_name: string;
  last_name?: string | null;
  email: string;
  university?: string | null;
  message: string;
}) {
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contact-form-email`;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${anonKey}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("[ContactNotification] Email trigger sent");
  } catch (error) {
    console.error("[ContactNotification] Failed to trigger email:", error);
    // Don't throw - email failure shouldn't break the form
  }
}
