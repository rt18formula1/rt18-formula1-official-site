"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function InquiryClient() {
  const [lang, setLang] = useState<"ja" | "en">("ja");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    orderId: "",
    subject: "",
    message: "",
  });
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("language");
    if (stored === "en") setLang("en");
  }, []);

  const t = {
    title: lang === "ja" ? "ショップに関するお問い合わせ" : "Shop Inquiry",
    desc: lang === "ja" ? "商品についてのご質問やご注文に関するお問い合わせはこちらからお願いいたします。" : "Please use this form for questions about products or inquiries regarding your order.",
    name: lang === "ja" ? "お名前" : "Name",
    namePlaceholder: lang === "ja" ? "山田 太郎" : "John Doe",
    email: lang === "ja" ? "メールアドレス" : "Email",
    emailPlaceholder: lang === "ja" ? "example@example.com" : "example@example.com",
    orderId: lang === "ja" ? "注文番号（任意）" : "Order ID (Optional)",
    orderIdPlaceholder: lang === "ja" ? "例: ORD-12345" : "e.g. ORD-12345",
    subject: lang === "ja" ? "件名" : "Subject",
    subjectPlaceholder: lang === "ja" ? "商品の配送について" : "Regarding product delivery",
    message: lang === "ja" ? "お問い合わせ内容" : "Message",
    messagePlaceholder: lang === "ja" ? "お問い合わせ内容をご記入ください" : "Please enter your message here",
    submit: lang === "ja" ? "送信する" : "Send Message",
    submitting: lang === "ja" ? "送信中..." : "Sending...",
    success: lang === "ja" ? "お問い合わせを送信しました。内容を確認次第、ご連絡いたします。" : "Your inquiry has been sent. We will get back to you shortly.",
    error: lang === "ja" ? "エラーが発生しました。時間をおいて再度お試しください。" : "An error occurred. Please try again later.",
    backToShop: lang === "ja" ? "ショップに戻る" : "Back to Shop",
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/shop/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setStatus("success");
      setFormData({ name: "", email: "", orderId: "", subject: "", message: "" });
    } catch (err: any) {
      console.error("Submit error:", err);
      setStatus("error");
      setErrorMessage(err.message || t.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 md:py-20">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 md:mb-12 text-center">
          <Link href="/shop" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-black transition-colors mb-6">
            ← {t.backToShop}
          </Link>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-4">{t.title}</h1>
          <p className="text-gray-500 text-sm md:text-base">{t.desc}</p>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-black/10 rounded-3xl p-6 md:p-10 shadow-xl">
          {status === "success" ? (
            <div className="text-center py-12 animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                ✓
              </div>
              <h2 className="text-2xl font-black mb-4">{t.success}</h2>
              <button 
                onClick={() => setStatus("idle")}
                className="mt-8 px-8 py-3 bg-black text-white font-black uppercase tracking-widest text-sm rounded-full hover:bg-gray-800 transition-all"
              >
                {lang === "ja" ? "新しく問い合わせる" : "Send another inquiry"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-bold text-gray-700">
                    {t.name} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t.namePlaceholder}
                    className="w-full px-4 py-3 bg-gray-50 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-bold text-gray-700">
                    {t.email} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t.emailPlaceholder}
                    className="w-full px-4 py-3 bg-gray-50 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Order ID */}
                <div className="space-y-2">
                  <label htmlFor="orderId" className="block text-sm font-bold text-gray-700">
                    {t.orderId}
                  </label>
                  <input
                    type="text"
                    id="orderId"
                    name="orderId"
                    value={formData.orderId}
                    onChange={handleChange}
                    placeholder={t.orderIdPlaceholder}
                    className="w-full px-4 py-3 bg-gray-50 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  />
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <label htmlFor="subject" className="block text-sm font-bold text-gray-700">
                    {t.subject}
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder={t.subjectPlaceholder}
                    className="w-full px-4 py-3 bg-gray-50 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label htmlFor="message" className="block text-sm font-bold text-gray-700">
                  {t.message} <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={t.messagePlaceholder}
                  className="w-full px-4 py-3 bg-gray-50 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-y"
                />
              </div>

              {/* Error Message */}
              {status === "error" && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
                  {errorMessage}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className={`w-full py-4 text-white font-black uppercase tracking-widest text-sm rounded-xl transition-all shadow-xl ${
                    status === "loading" 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-black hover:bg-gray-800 hover:shadow-2xl hover:-translate-y-0.5"
                  }`}
                >
                  {status === "loading" ? t.submitting : t.submit}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
