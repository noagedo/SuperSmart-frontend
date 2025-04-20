import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUsers from '../hooks/useUsers';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Alert,
  Container,
  Paper,
  Divider,
  createTheme,
  ThemeProvider,
  styled
} from '@mui/material';
import { useForm } from 'react-hook-form';
import logoGif from '../assets/Animation - 1735911293502.gif';
import { CredentialResponse, GoogleLogin } from '@react-oauth/google';
import Loading from './Loading';

const theme = createTheme({
  palette: {
    primary: {
      main: '#16a34a',
      light: '#22c55e',
      dark: '#15803d',
    },
  },
});

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
}));

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
          navigate('/');
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
          navigate('/');
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
    navigate('/');
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            py: 4
          }}
        >
          {isSubmitting && <Loading />}
          
          <StyledPaper elevation={3}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              mb: 4
            }}>
              <Box
                component="img"
                src={logoGif}
                alt="Logo"
                sx={{ 
                  width: 120,
                  height: 120,
                  mb: 2,
                  borderRadius: '50%',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#16a34a' }}>
                Welcome Back
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
                Sign in to continue to your account
              </Typography>
            </Box>

            <Box sx={{ width: '100%', mb: 3 }}>
              <GoogleLogin 
                onSuccess={onGoogleLoginSuccess} 
                onError={onGoogleLoginFailure}
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
              />
            </Box>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', px: 2 }}>
                OR
              </Typography>
            </Divider>

            <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                variant="outlined"
                {...register("email", { 
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address"
                  }
                })}
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#16a34a',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#16a34a',
                  }
                }}
              />

              <TextField
                label="Password"
                type="password"
                fullWidth
                variant="outlined"
                {...register("password", { required: "Password is required" })}
                error={!!errors.password}
                helperText={errors.password?.message}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#16a34a',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#16a34a',
                  }
                }}
              />

              {signInError && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 2,
                    '& .MuiAlert-icon': {
                      color: '#ef4444'
                    }
                  }}
                >
                  {signInError}
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isLoading}
                sx={{
                  bgcolor: '#16a34a',
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: '#15803d'
                  },
                  '&.Mui-disabled': {
                    bgcolor: '#16a34a',
                    opacity: 0.7
                  }
                }}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>

              <Box sx={{ 
                mt: 3,
                textAlign: 'center'
              }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Don't have an account?{' '}
                  <Button 
                    onClick={() => navigate('/signup')}
                    sx={{ 
                      color: '#16a34a',
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: 'transparent',
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    Sign Up
                  </Button>
                </Typography>
              </Box>
            </form>
          </StyledPaper>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default SignIn;