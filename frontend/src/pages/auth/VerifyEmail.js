import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { registerComplete, resendOtp } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // Get email from state passed during navigation
  const email = location.state?.email;
  
  // If no email in state, redirect to register
  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);
  
  // Focus first input on load
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);
  
  // Handle countdown for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && resendDisabled) {
      setResendDisabled(false);
    }
  }, [countdown, resendDisabled]);
  
  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (/^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto focus next input
      if (value && index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
    }
  };
  
  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    }
  };
  
  // Handle paste event
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text/plain').trim();
    
    if (/^\d{6}$/.test(pasteData)) {
      const newOtp = pasteData.split('');
      setOtp(newOtp);
      
      // Focus the last input
      if (inputRefs.current[5]) {
        inputRefs.current[5].focus();
      }
    }
  };
  
  // Verify OTP and complete registration
  const handleVerify = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      toast.error('Please enter all 6 digits of the verification code');
      return;
    }
    
    try {
      setLoading(true);
      const response = await registerComplete(email, otpString);
      
      // Login user
      login(response.data.user, response.data.token);
      
      toast.success('Email verified and registration completed!');
      navigate('/');
    } catch (error) {
      //console.error('Verification error:', error);
      toast.error(error.response?.data?.message || 'Failed to verify email');
    } finally {
      setLoading(false);
    }
  };
  
  // Resend OTP
  const handleResend = async () => {
    try {
      setResendDisabled(true);
      setCountdown(60); // 60 second cooldown
      
      await resendOtp(email, 'registration');
      toast.success('Verification code resent to your email');
    } catch (error) {
      console.error('Resend error:', error);
      toast.error('Failed to resend verification code');
      setResendDisabled(false);
      setCountdown(0);
    }
  };
  
  if (!email) {
    return null; // Will redirect to register
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-center">Email Verification</h2>
        
        <div className="mb-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            We've sent a verification code to <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Enter the 6-digit code below to verify your email and complete registration
          </p>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-center gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-14 text-center text-2xl border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-color focus:ring-1 focus:ring-primary-color"
              />
            ))}
          </div>
        </div>
        
        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full px-5 py-3 text-white bg-primary-color hover:bg-opacity-90 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-color disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify and Complete Registration'}
        </button>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Didn't receive the code?
          </p>
          <button
            onClick={handleResend}
            disabled={resendDisabled}
            className="text-primary-color hover:text-opacity-80 focus:outline-none disabled:opacity-50"
          >
            {resendDisabled 
              ? `Resend code in ${countdown}s` 
              : 'Resend verification code'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;