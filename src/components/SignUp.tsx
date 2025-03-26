import React, { useState, useRef, useEffect } from 'react';
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
  IconButton,
  Divider,
  createTheme,
  ThemeProvider,
  styled
} from '@mui/material';
import avatar from '../assets/avatarProfile.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage } from '@fortawesome/free-solid-svg-icons';
import { useForm } from 'react-hook-form';
import logoGif from '../assets/Animation - 1735911293502.gif';
import { CredentialResponse, GoogleLogin } from '@react-oauth/google';
import userService from '../services/user-service';
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
  userName: string;
  password: string;
  img: File[];
}

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, signUpWithGoogle, error, isLoading } = useUsers();
  const inputFileRef = useRef<HTMLInputElement | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>();
  const [img] = watch(["img"]);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (img?.[0]) {
      const file = img[0];
      const validFileTypes = ['image/jpeg', 'image/png'];
      
      if (!validFileTypes.includes(file.type)) {
        setSignupError('Please upload a valid image file (JPEG or PNG).');
        return;
      }
      setSelectedImage(img[0]);

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(file);
      };
      reader.readAsDataURL(file);
    }
  }, [img]);

  const onSubmit = async (data: FormData) => {
    if (!selectedImage) {
      setSignupError('Please upload a profile picture.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedImage);
      
      const { request: uploadRequest } = userService.uploadImage(selectedImage);
      const uploadResponse = await uploadRequest;
      
      if (!uploadResponse.data?.url) {
        throw new Error('Failed to upload image');
      }

      await signUp(data.email, data.password, data.userName, selectedImage);
      
      if (!error) {
        setIsSubmitting(true);
        setTimeout(() => {
          navigate('/');
          window.location.reload();
        }, 1000);
      }
    } catch (err) {
      console.error("Error during sign up:", err);
      setSignupError('Failed to complete signup. Please try again.');
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
        setSignupError(result.error ?? 'An unknown error occurred');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Error during Google login:", err);
      setSignupError(err instanceof Error ? err.message : 'Failed to sign in with Google');
      setIsSubmitting(false);
    }
  };

  const onGoogleLoginFailure = () => {
    setSignupError('Google sign in failed. Please try again.');
  };

  const { ref, ...restRegisterParams } = register("img");

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
                Create Account
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
                Join us and start saving on your groceries
              </Typography>
            </Box>

            {signupError && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  '& .MuiAlert-icon': {
                    color: '#ef4444'
                  }
                }}
              >
                {signupError}
              </Alert>
            )}

            <Box sx={{ width: '100%', mb: 3 }}>
              <GoogleLogin 
                onSuccess={onGoogleLoginSuccess} 
                onError={onGoogleLoginFailure}
                theme="outline"
                size="large"
                text="signup_with"
                shape="rectangular"
              />
            </Box>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', px: 2 }}>
                OR
              </Typography>
            </Divider>

            <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                mb: 3
              }}>
                <Box sx={{ position: 'relative', mb: 2 }}>
                  <Box
                    component="img"
                    src={selectedImage ? URL.createObjectURL(selectedImage) : avatar}
                    alt="Profile"
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '4px solid',
                      borderColor: 'primary.light'
                    }}
                  />
                  <IconButton
                    onClick={() => inputFileRef.current?.click()}
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: '#16a34a',
                      color: 'white',
                      '&:hover': {
                        bgcolor: '#15803d'
                      }
                    }}
                  >
                    <FontAwesomeIcon icon={faImage} />
                  </IconButton>
                  <input
                    ref={(item) => { 
                      ref(item); 
                      inputFileRef.current = item;
                    }}
                    {...restRegisterParams}
                    type="file"
                    accept="image/png, image/jpeg"
                    style={{ display: 'none' }}
                  />
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {selectedImage ? selectedImage.name : 'No file selected'}
                </Typography>
              </Box>

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
                {...register("password", { 
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters long"
                  }
                })}
                error={!!errors.password}
                helperText={errors.password?.message}
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
                label="Username"
                fullWidth
                variant="outlined"
                {...register("userName", { required: "Username is required" })}
                error={!!errors.userName}
                helperText={errors.userName?.message}
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
                {isLoading ? 'Signing up...' : 'Sign Up'}
              </Button>

              <Box sx={{ 
                mt: 3,
                textAlign: 'center'
              }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Already have an account?{' '}
                  <Button 
                    onClick={() => navigate('/signin')}
                    sx={{ 
                      color: '#16a34a',
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: 'transparent',
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    Sign In
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

export default SignUp;