import { FC, useState, useRef, useEffect } from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    Paper,
    List,
    ListItem,
    ListItemText,
    Divider,
    IconButton,
} from "@mui/material";
import useUsers from "../hooks/useUsers";
import { User } from "../services/user-service";
import userService from "../services/user-service";
import cartService, { Cart as CartType } from "../services/cart-service";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faHistory, faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { Apple, Camera, Save, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PersonalAreaProps {
    user: User;
}

const PersonalArea: FC<PersonalAreaProps> = ({ user }) => {
    const { updateUser } = useUsers();
    const [editMode, setEditMode] = useState(false);
    const [userName, setUserName] = useState(user.userName);
    const [email, setEmail] = useState(user.email);
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const inputFileRef = useRef<HTMLInputElement | null>(null);
    const [savedCarts, setSavedCarts] = useState<CartType[]>([]);
    const [loadingCarts, setLoadingCarts] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSavedCarts = async () => {
            if (user?._id) {
                setLoadingCarts(true);
                try {
                    const { request } = cartService.getUserCarts(user._id);
                    const response = await request;
                    if (response.data) {
                        setSavedCarts(response.data);
                    } else {
                        console.error("Failed to fetch saved carts:", response);
                    }
                } catch (error) {
                    console.error("Error fetching saved carts:", error);
                } finally {
                    setLoadingCarts(false);
                }
            }
        };

        fetchSavedCarts();
    }, [user?._id]);

    const handleViewCart = (cartId: string) => {
        navigate(`/cart/${cartId}`);
    };

    const handleSave = async () => {
        setUpdateError(null);
        try {
            let avatarUrl = user.profilePicture;

            if (profilePicture) {
                const formData = new FormData();
                formData.append("file", profilePicture);
                const { request: uploadRequest } = userService.uploadImage(profilePicture);
                const uploadResponse = await uploadRequest;
                avatarUrl = uploadResponse.data.url;
            }

            const updatedUser = { ...user, userName, email, profilePicture: avatarUrl };
            const result = await updateUser(updatedUser);
            if (result.success) {
                setEditMode(false);
                window.location.reload();
            } else {
                setUpdateError(result.error ?? null);
            }
        } catch (err) {
            console.error("Error updating profile:", err);
            setUpdateError("Failed to update profile. Please try again.");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files[0]) {
            setProfilePicture(files[0]);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            py: 6,
            px: 4
        }}>
            <Paper elevation={3} sx={{
                maxWidth: 800,
                mx: 'auto',
                borderRadius: 3,
                overflow: 'hidden'
            }}>
                {/* Header */}
                <Box sx={{
                    bgcolor: '#16a34a',
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                }}>
                    <Apple size={32} color="white" />
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, flexGrow: 1 }}>
                        האזור האישי שלי
                    </Typography>
                    <IconButton color="inherit" onClick={() => { /* Handle navigation to a full history page if needed */ }}>
                        <FontAwesomeIcon icon={faHistory} />
                    </IconButton>
                </Box>

                {/* Profile Content */}
                <Box sx={{ p: 4 }}>
                    {/* Profile Picture Section */}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: 'center',
                        gap: 4,
                        mb: 4
                    }}>
                        <Box sx={{ position: 'relative' }}>
                            <Box
                                component="img"
                                src={profilePicture ? URL.createObjectURL(profilePicture) : user.profilePicture}
                                alt={user.userName}
                                sx={{
                                    width: 120,
                                    height: 120,
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '4px solid #16a34a'
                                }}
                            />
                            {editMode && (
                                <Button
                                    variant="contained"
                                    component="label"
                                    sx={{
                                        position: 'absolute',
                                        bottom: 0,
                                        right: 0,
                                        minWidth: 'auto',
                                        width: 36,
                                        height: 36,
                                        borderRadius: '50%',
                                        bgcolor: '#16a34a',
                                        '&:hover': { bgcolor: '#15803d' }
                                    }}
                                >
                                    <Camera size={18} />
                                    <input
                                        ref={inputFileRef}
                                        type="file"
                                        accept="image/png, image/jpeg"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                    />
                                </Button>
                            )}
                        </Box>

                        <Box sx={{ flex: 1 }}>
                            {editMode ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        label="שם משתמש"
                                        value={userName}
                                        onChange={(e) => setUserName(e.target.value)}
                                        variant="outlined"
                                        fullWidth
                                        sx={{
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
                                        label="אימייל"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        variant="outlined"
                                        fullWidth
                                        sx={{
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
                                </Box>
                            ) : (
                                <>
                                    <Typography variant="h4" sx={{ color: '#16a34a', fontWeight: 700, mb: 1 }}>
                                        {user.userName}
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                        {user.email}
                                    </Typography>
                                </>
                            )}
                        </Box>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        העגלות השמורות שלי
                    </Typography>

                    {loadingCarts ? (
                        <Typography color="textSecondary">טוען עגלות שמורות...</Typography>
                    ) : savedCarts.length > 0 ? (
                        <List>
                            {savedCarts.map((cart) => (
                                <ListItem
                                    key={cart._id}
                                    sx={{
                                        borderBottom: '1px solid #eee',
                                        '&:last-child': { borderBottom: 'none' },
                                        p: 2,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <ListItemText
                                        primary={cart.name || `עגלה מתאריך ${new Date(cart.createdAt || Date.now()).toLocaleDateString('he-IL')}`}
                                        secondary={`נשמרה ב: ${new Date(cart.createdAt || Date.now()).toLocaleDateString('he-IL')} ${new Date(cart.createdAt || Date.now()).toLocaleTimeString('he-IL')}`}
                                    />
                                    <Button
                                        onClick={() => handleViewCart(cart._id || '')}
                                        variant="outlined"
                                        color="primary"
                                        size="small"
                                    >
                                        הצג עגלה
                                    </Button>
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography color="textSecondary">אין עגלות שמורות.</Typography>
                    )}

                    <Divider sx={{ my: 3 }} />

                    {/* Action Buttons */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        mt: 4
                    }}>
                        {editMode ? (
                            <Button
                                variant="contained"
                                onClick={handleSave}
                                startIcon={<Save />}
                                sx={{
                                    bgcolor: '#16a34a',
                                    '&:hover': { bgcolor: '#15803d' },
                                    px: 4
                                }}
                            >
                                שמור שינויים
                            </Button>
                        ) : (
                            <Button
                                variant="outlined"
                                onClick={() => setEditMode(true)}
                                startIcon={<Edit2 />}
                                sx={{
                                    color: '#16a34a',
                                    borderColor: '#16a34a',
                                    '&:hover': {
                                        borderColor: '#15803d',
                                        bgcolor: 'rgba(22, 163, 74, 0.04)'
                                    },
                                    px: 4
                                }}
                            >
                                ערוך פרופיל
                            </Button>
                        )}
                    </Box>

                    {/* Error Message */}
                    {updateError && (
                        <Alert severity="error" sx={{ mt: 3 }}>
                            {updateError}
                        </Alert>
                    )}
                </Box>
            </Paper>
        </Box>
    );
};

export default PersonalArea;