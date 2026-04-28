// src/app/pages/login/page.tsx - FIXED WITH SUSPENSE BOUNDARY
"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from '@/utils/LanguageContext';
import { Eye, EyeOff, Lock, Globe, AlertCircle, Shield, Users, Home, Settings, Scale, DollarSign } from "lucide-react";
import Image from 'next/image';

// Role-based redirect mapping
const ROLE_REDIRECTS = {
  ADMIN: '/pages/accounting',
  HR_MANAGER: '/pages/hr',
  HOUSING_MANAGER: '/pages/housing',
  OPERATIONS_MANAGER: '/pages/operations',
  ACCOUNTANT: '/pages/accounting',
  LEGAL_MANAGER: '/pages/legal'
};

const ROLE_INFO = {
  ADMIN: { icon: Shield, color: 'text-red-600' },
  HR_MANAGER: { icon: Users, color: 'text-blue-600' },
  HOUSING_MANAGER: { icon: Home, color: 'text-orange-600' },
  OPERATIONS_MANAGER: { icon: Settings, color: 'text-purple-600' },
  ACCOUNTANT: { icon: DollarSign, color: 'text-green-600' },
  LEGAL_MANAGER: { icon: Scale, color: 'text-indigo-600' }
};

// ✅ FIXED: Separate component that uses useSearchParams
function LoginContent() {
  const { language, setLanguage, t, isRTL, isLoading } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State management
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  // Safe access to searchParams
  const callbackUrl = searchParams?.get("callbackUrl") || "/pages/accounting";
  const authError = searchParams?.get("error");

  // Redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (session?.user) {
        const redirectUrl = ROLE_REDIRECTS[session.user.role as keyof typeof ROLE_REDIRECTS] || '/pages/accounting';
        router.replace(redirectUrl);
      } else {
        setPageLoading(false);
      }
    };
    checkSession();
  }, [router]);

  // Handle errors passed in the URL from NextAuth
  useEffect(() => {
    if (authError) {
      const errorMap: { [key: string]: string } = {
        CredentialsSignin: t('auth.invalidCredentials'),
        Configuration: t('auth.authConfigurationError'),
      };
      setError(errorMap[authError] || t('auth.loginFailedGeneric'));
    }
  }, [authError, t]);

  const toggleLanguage = () => {
    setLanguage(language === "ar" ? "en" : "ar");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (!email || !password) {
      setError(t('auth.pleaseFillAllFields'));
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t('auth.loginFailedGeneric'));
      } else if (result?.ok) {
        const session = await getSession();
        if (session?.user?.role) {
          const redirectUrl = ROLE_REDIRECTS[session.user.role as keyof typeof ROLE_REDIRECTS] || '/pages/accounting';
          router.replace(redirectUrl);
        } else {
          router.replace(callbackUrl);
        }
      } else {
        setError(t('auth.loginFailedGeneric'));
      }
    } catch (err) {
      setError(t('auth.networkError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pageLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col p-4 ${isRTL ? "rtl" : "ltr"}`}>
      {/* Language Toggle */}
      <div className={`absolute top-6 ${isRTL ? "right-6" : "left-6"}`}>
        <button
          onClick={toggleLanguage}
          className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm hover:bg-white transition-colors"
        >
          <Globe className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">
            {language === "ar" ? "EN" : "AR"}
          </span>
        </button>
      </div>

      {/* Company Branding */}
      <div className={`absolute top-6 ${isRTL ? "left-6" : "right-6"}`}>
        <div className={`flex items-center ${isRTL ? "space-x-reverse space-x-3" : "space-x-3"}`}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden">
            <Image
              src="/malti-logo.png"
              alt={t('company.name')}
              width={48}
              height={48}
              className="object-cover"
              priority
            />
          </div>
          <div className={isRTL ? "text-right" : "text-left"}>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('company.name')}
            </h1>
            <p className="text-sm text-gray-600">
              {t('company.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {t('auth.signIn')}
              </h2>
              <p className="text-gray-600 mt-2">
                {t('auth.accessFleetSystem')}
              </p>
            </div>

            {/* Role Information Panel */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">
                {t('auth.availableRoles')}
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(ROLE_INFO).map(([roleKey, roleInfo]) => {
                  const Icon = roleInfo.icon;
                  // Map role keys to translation keys
                  const roleTranslationMap: { [key: string]: string } = {
                    'ADMIN': 'admin',
                    'HR_MANAGER': 'hrManager',
                    'HOUSING_MANAGER': 'housingManager',
                    'OPERATIONS_MANAGER': 'operationsManager',
                    'ACCOUNTANT': 'accountant',
                    'LEGAL_MANAGER': 'legalManager'
                  };
                  const translationKey = roleTranslationMap[roleKey] || roleKey;
                  return (
                    <div key={roleKey} className="flex items-center gap-3 p-2 bg-white rounded">
                      <Icon className={`w-4 h-4 ${roleInfo.color}`} />
                      <span className="text-sm">
                        {t(`roles.${translationKey}`)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? "text-right" : "text-left"}`}>
                  {t('auth.emailAddress')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${isRTL ? "text-right" : "text-left"}`}
                  placeholder={t('auth.emailPlaceholder')}
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? "text-right" : "text-left"}`}>
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`block w-full ${isRTL ? "pr-3 pl-12 text-right" : "pl-3 pr-12 text-left"} py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                    placeholder={t('auth.passwordPlaceholder')}
                    required
                  />
                  <button
                    type="button"
                    className={`absolute inset-y-0 ${isRTL ? "left-0 pl-3" : "right-0 pr-3"} flex items-center`}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className={`text-red-600 text-sm ${isRTL ? 'mr-2' : 'ml-2'}`}>{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className={isRTL ? 'mr-2' : 'ml-2'}>
                      {t('auth.signingIn')}
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-2" />
                    {t('auth.signIn')}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// ✅ FIXED: Main component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}