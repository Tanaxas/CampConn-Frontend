import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { setupMfa, enableMfa } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const MfaSetup = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);
  
  // Initialize MFA setup
  useEffect(() => {
    const initMfa = async () => {
      try {
        setInitLoading(true);
        const response = await setupMfa();
        setSecret(response.data.secret);
        setQrCode(response.data.qrCode);
      } catch (error) {
        console.error('MFA setup error:', error);
        toast.error('Failed to initialize MFA setup');
        // Redirect back to profile
        navigate('/profile');
      } finally {
        setInitLoading(false);
      }
    };
    
    initMfa();
  }, [navigate]);
  
  // Focus first input on load
  useEffect(() => {
    if (!initLoading && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [initLoading]);
  
  // Handle code input
  const handleCodeChange = (index, value) => {
    if (/^\d*$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      
      // Auto focus next input
      if (value && index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
    }
  };
  
  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!code[index] && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    }
  };
  
  // Handle paste event
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text/plain').trim();
    
    if (/^\d{6}$/.test(pasteData)) {
      // Set each digit
      for (let i = 0; i < 6; i++) {
        if (inputRefs.current[i]) {
          const newCode = [...code];
          newCode[i] = pasteData[i];
          setCode(newCode);
        }
      }
      
      // Focus the last input
      if (inputRefs.current[5]) {
        inputRefs.current[5].focus();
      }
    }
  };
  
  // Verify and enable MFA
  const verifyAndEnable = async () => {
    try {
      setError('');
      
      // Validate code (all digits entered)
      const fullCode = code.join('');
      if (fullCode.length !== 6) {
        setError('Please enter all 6 digits');
        return;
      }
      
      setLoading(true);
      await enableMfa(fullCode);
      
      // Update user state (MFA enabled)
      updateUser({ ...user, mfa_enabled: true });
      
      toast.success('Two-factor authentication enabled successfully!');
      navigate('/profile');
    } catch (error) {
      console.error('MFA verification error:', error);
      setError(error.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };
  
  // Skip MFA setup
  const skipSetup = async () => {
    toast.info('You can enable two-factor authentication later from your profile');
    navigate('/');
  };
  
  if (initLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-color"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-center">Set Up Two-Factor Authentication</h2>
        <p className="mb-6 text-center text-gray-600 dark:text-gray-400">Secure your account by enabling 2FA</p>
        
        <div className="mb-6 text-center">
          {qrCode && (
            <div className="flex justify-center mb-4">
              <img src={qrCode} alt="QR Code" className="w-48 h-48" />
            </div>
          )}
          
          <p className="mb-4">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
          
          <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded text-center">
            <p className="font-medium">Secret key:</p>
            <p className="font-mono text-sm break-all">{secret}</p>
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400">
            If you can't scan the QR code, you can manually enter the secret key into your authenticator app.
          </p>
        </div>
        
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
            Enter the verification code from your app
          </label>
          
          <div className="flex justify-center space-x-2 mb-4">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                className="w-10 h-12 text-center text-xl font-medium border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={code[index]}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
              />
            ))}
          </div>
          
          {error && (
            <p className="text-center text-sm text-red-600 mb-4">{error}</p>
          )}
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={skipSetup}
            className="w-1/2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition"
          >
            Skip for Now
          </button>
          
          <button
            onClick={verifyAndEnable}
            disabled={loading}
            className="w-1/2 px-4 py-2 text-white bg-primary-color hover:bg-opacity-90 rounded-lg transition disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </span>
            ) : (
              'Verify & Enable'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MfaSetup;