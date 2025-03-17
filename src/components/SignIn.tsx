import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUsers from '../hooks/useUsers';
import { Box, Button, TextField, Typography, Alert } from '@mui/material';
import { useForm } from 'react-hook-form';
import logoGif from '../assets/Animation - 1735911293502.gif';
import { CredentialResponse, GoogleLogin } from '@react-oauth/google';
import Loading from './Loading';

interface FormData {
  email: string;
  password: string;
}

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signUpWithGoogle, isLoading, user } = useUsers();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: FormData) => {
    setSignInError(null);
    setIsSubmitting(true);
    try {
      const result = await signIn(data.email, data.password);
      if (result.success) {
        setIsSubmitting(true);
        setTimeout(() => {
          navigate('/posts');
          window.location.reload();
        }, 1000);
      } else {
        setSignInError(result.error || 'Invalid email or password. Please try again.');
        setIsSubmitting(false);
      }
    } catch {
      setSignInError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const onGoogleLoginSuccess = async (credentialResponse: CredentialResponse) => {
    setIsSubmitting(true);
    try {
      const result = await signUpWithGoogle(credentialResponse);
      if (result.success) {
        setIsSubmitting(true);
        setTimeout(() => {
          navigate('/posts');
          window.location.reload();
        }, 1000);
      } else {
        setSignInError(result.error || 'An unexpected error occurred.');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Error during Google login:", err);
      setSignInError(err instanceof Error ? err.message : 'Failed to sign in with Google');
      setIsSubmitting(false);
    }
  };

  const onGoogleLoginFailure = () => {
    setSignInError('Google sign in failed. Please try again.');
  };

  if (isLoading) {
    return <Loading />;
  }

  if (user) {
    navigate('/posts');
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: '#f5f5f5',
        p: 2
      }}
    >
      {isSubmitting && <Loading />}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: 400,
          padding: 3,
          boxShadow: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
        }}
      >
        <Box
          component="img"
          src={logoGif}
          alt="Logo"
          sx={{ width: 150, height: 150, marginBottom: 2 }}
        />
        <Box sx={{ width: '100%', mb: 2 }}>
          <GoogleLogin 
            onSuccess={onGoogleLoginSuccess} 
            onError={onGoogleLoginFailure}
            theme="outline"
            size="large"
            text="signin_with"
            shape="rectangular"
          />
        </Box>

        <Typography variant="h4" component="h1" gutterBottom>
          Sign In
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
          <TextField
            label="Email"
            type="email"
            variant="outlined"
            fullWidth
            {...register("email", { 
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address"
              }
            })}
            error={!!errors.email}
            helperText={errors.email?.message}
            margin="normal"
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            {...register("password", { required: "Password is required" })}
            error={!!errors.password}
            helperText={errors.password?.message}
            margin="normal"
          />

          {signInError && <Alert severity="error">{signInError}</Alert>}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isLoading}
            sx={{ mt: 2 }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <Typography variant="body2" sx={{ mt: 2 }}>
          Don't have an account? <Button onClick={() => navigate('/signup')}>Sign Up</Button>
        </Typography>
      </Box>
    </Box>
  );
};

export default SignIn;
