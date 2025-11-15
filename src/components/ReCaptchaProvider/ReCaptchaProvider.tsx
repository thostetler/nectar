import { FC } from 'react';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

/**
 * ReCAPTCHA provider wrapper for pages that need it
 * Only load on specific pages to reduce bundle size on pages that don't need it
 */
export const ReCaptchaProvider: FC = ({ children }) => {
  return (
    <GoogleReCaptchaProvider reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ''}>
      {children}
    </GoogleReCaptchaProvider>
  );
};
