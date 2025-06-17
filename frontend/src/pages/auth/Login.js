import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { login, verifyMfa } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showMfaVerification, setShowMfaVerification] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [mfaCode, setMfaCode] = useState(['', '', '', '', '', '']);
  const [mfaError, setMfaError] = useState('');
  
  // Login form validation
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      remember: false
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required')
        .matches(/@hit\.ac\.zw$/, 'Must use a valid HIT email address'),
      password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required')
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const response = await login(values.email, values.password);
        
        // Check if MFA is required
        if (response.data.user && response.data.user.require_mfa) {
          // Show MFA verification
          setTempUser({ ...response.data.user, email: values.email });
          setShowMfaVerification(true);
          setMfaCode(['', '', '', '', '', '']);
          setMfaError('');
          
          // Focus first input after render
          setTimeout(() => {
            const inputs = document.querySelectorAll('.verification-code-input input');
            if (inputs.length > 0) {
              inputs[0].focus();
            }
          }, 100);
        } else {
          // Login successful
          authLogin(response.data.user, response.data.token);
          toast.success('Login successful!');
          navigate('/');
        }
      } catch (error) {
        console.error('Login error:', error);
        toast.error(error.response?.data?.message || 'Invalid email or password');
      } finally {
        setLoading(false);
      }
    }
  });
  
  // Handle MFA code input change
  const handleMfaDigitChange = (index, value) => {
    if (/^\d*$/.test(value)) {
      const newCode = [...mfaCode];
      newCode[index] = value;
      setMfaCode(newCode);
      
      // Auto-focus next input
      if (value && index < 5) {
        const inputs = document.querySelectorAll('.verification-code-input input');
        inputs[index + 1].focus();
      }
    }
  };
  
  // Handle backspace in MFA input
  const handleMfaKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !mfaCode[index] && index > 0) {
      const inputs = document.querySelectorAll('.verification-code-input input');
      inputs[index - 1].focus();
    }
  };
  
  // Handle MFA code paste
  const handleMfaPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text/plain').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const newCode = pasteData.split('');
      setMfaCode(newCode);
    }
  };
  
  // Verify MFA code
  const verifyMfaCode = async () => {
    try {
      setMfaError('');
      setLoading(true);
      
      const code = mfaCode.join('');
      if (code.length !== 6) {
        setMfaError('Please enter all 6 digits');
        return;
      }
      
      const response = await verifyMfa(tempUser.email, code);
      
      // MFA verification successful
      authLogin(response.data.user, response.data.token);
      toast.success('Login successful!');
      navigate('/');
    } catch (error) {
      console.error('MFA verification error:', error);
      setMfaError(error.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-center">Campus Connect Login</h2>
        <p className="mb-6 text-center text-gray-600 dark:text-gray-400">For Harare Institute of Technology Students & Lecturers</p>
        
        {showMfaVerification ? (
          <div>
            <h3 className="text-xl font-bold mb-4 text-center">Two-Factor Authentication</h3>
            <p className="mb-4 text-center text-gray-600 dark:text-gray-400">Please enter the verification code from your authenticator app.</p>
            
            <div className="mb-6">
              <div className="verification-code-input flex justify-center space-x-2">
                {mfaCode.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleMfaDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleMfaKeyDown(index, e)}
                    onPaste={handleMfaPaste}
                    className="w-10 h-12 text-center text-lg font-medium border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ))}
              </div>
              {mfaError && <p className="mt-2 text-sm text-red-600 text-center">{mfaError}</p>}
            </div>
            
            <button
              type="button"
              onClick={verifyMfaCode}
              disabled={loading}
              className="w-full px-5 py-2.5 text-white bg-primary-color hover:bg-opacity-90 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-color disabled:opacity-50"
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
                'Verify Code'
              )}
            </button>
            
            <button
              type="button"
              onClick={() => setShowMfaVerification(false)}
              className="w-full mt-4 px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg focus:outline-none"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={formik.handleSubmit}>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="name@hit.ac.zw"
                className={`w-full px-3 py-2 text-base border ${
                  formik.touched.email && formik.errors.email
                    ? 'border-red-500 dark:border-red-400'
                    : 'border-gray-300 dark:border-gray-600'
                } rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.email}
              />
              {formik.touched.email && formik.errors.email && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.email}</p>
              )}
            </div>
            
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                className={`w-full px-3 py-2 text-base border ${
                  formik.touched.password && formik.errors.password
                    ? 'border-red-500 dark:border-red-400'
                    : 'border-gray-300 dark:border-gray-600'
                } rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.password}
              />
              {formik.touched.password && formik.errors.password && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.password}</p>
              )}
            </div>

            <div className="w-full text-right">
              <Link to="/forgot-password" className="text-sm text-primary-color hover:underline">
                Forgot password?
              </Link>
            </div>
            
            <div className="flex items-start mb-6">
              <div className="flex items-center h-5">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  className="w-4 h-4 border border-gray-300 rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                  onChange={formik.handleChange}
                  checked={formik.values.remember}
                />
              </div>
              <label htmlFor="remember" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Remember me
              </label>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full px-5 py-2.5 text-white bg-primary-color hover:bg-opacity-90 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-color disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
            
            <div className="text-sm mt-4 text-center">
              <span className="text-gray-600 dark:text-gray-400">Don't have an account? </span>
              <Link to="/register" className="text-hit-primary hover:underline dark:text-hit-secondary">
                Register
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;