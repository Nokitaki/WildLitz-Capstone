// src/components/auth/AuthModal.jsx - FIXED VERSION
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/components/AuthModal.module.css';

const AuthModal = ({ isOpen, onClose, defaultMode = 'login' }) => {
  const [mode, setMode] = useState(defaultMode); // 'login' or 'register'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register } = useAuth();

  // Debug log
  console.log('AuthModal rendering with isOpen:', isOpen, 'mode:', mode);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (mode === 'register' && !formData.firstName) {
      newErrors.firstName = 'First name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      let result;
      if (mode === 'login') {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(
          formData.email, 
          formData.password, 
          formData.firstName, 
          formData.lastName
        );
      }

      if (result.success) {
        // Reset form and close modal
        setFormData({ email: '', password: '', firstName: '', lastName: '' });
        setErrors({});
        onClose();
      } else {
        setErrors({ submit: result.error });
      }
    } catch (error) {
      setErrors({ submit: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setErrors({});
    setFormData({ email: '', password: '', firstName: '', lastName: '' });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className={styles['auth-modal-overlay']}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className={styles['auth-modal']}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles['auth-modal-header']}>
            <h2>{mode === 'login' ? '🔐 Welcome Back!' : '🌟 Join WildLitz!'}</h2>
            <button className={styles['auth-modal-close']} onClick={onClose}>
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles['auth-form']}>
            {mode === 'register' && (
              <>
                <div className={styles['form-group']}>
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={errors.firstName ? styles.error : ''}
                    placeholder="Enter your first name"
                  />
                  {errors.firstName && <span className={styles['error-text']}>{errors.firstName}</span>}
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="lastName">Last Name (Optional)</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter your last name"
                  />
                </div>
              </>
            )}

            <div className={styles['form-group']}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={errors.email ? styles.error : ''}
                placeholder="Enter your email"
              />
              {errors.email && <span className={styles['error-text']}>{errors.email}</span>}
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={errors.password ? styles.error : ''}
                placeholder="Enter your password"
              />
              {errors.password && <span className={styles['error-text']}>{errors.password}</span>}
            </div>

            {errors.submit && (
              <div className={styles['submit-error']}>
                {errors.submit}
              </div>
            )}

            <button 
              type="submit" 
              className={styles['auth-submit-btn']}
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? (mode === 'login' ? 'Logging in...' : 'Creating account...') 
                : (mode === 'login' ? 'Login' : 'Create Account')
              }
            </button>

            <div className={styles['auth-switch']}>
              {mode === 'login' ? (
                <p>
                  Don't have an account?{' '}
                  <button type="button" onClick={switchMode} className={styles['auth-switch-btn']}>
                    Sign up here
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button type="button" onClick={switchMode} className={styles['auth-switch-btn']}>
                    Login here
                  </button>
                </p>
              )}
            </div>
          </form>

          <div className={styles['auth-benefits']}>
            <h4>🎯 Why create an account?</h4>
            <ul>
              <li>📊 Track your learning progress</li>
              <li>🏆 See your accuracy improvements</li>
              <li>📈 View detailed performance analytics</li>
              <li>🎮 Continue where you left off</li>
            </ul>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal;