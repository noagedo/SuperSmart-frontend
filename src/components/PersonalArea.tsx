import { FC, useState, useRef } from "react";
import { Avatar, Box, Typography, TextField, Button, Alert } from "@mui/material";
import useUsers from "../hooks/useUsers";
import { User } from "../services/user-service";

import userService from "../services/user-service";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage } from '@fortawesome/free-solid-svg-icons';

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
    <Box>
      <Box display="flex" alignItems="center" mb={2} p={2} border={1} borderColor="grey.300" borderRadius={2}>
        <Avatar src={profilePicture ? URL.createObjectURL(profilePicture) : user.profilePicture} alt={user.userName} sx={{ width: 80, height: 80 }} />
        <Box ml={3} flex={1}>
          {editMode ? (
            <>
              <TextField
                label="User Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                variant="outlined"
                size="small"
                margin="dense"
                sx={{ width: 'auto' }}
              />
              <TextField
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                variant="outlined"
                size="small"
                margin="dense"
                sx={{ mt: 1, width: 'auto' }}
              />
              <Button
                variant="contained"
                component="label"
                sx={{ mt: 1 }}
              >
                <FontAwesomeIcon icon={faImage} />
                <input
                  ref={inputFileRef}
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </Button>
            </>
          ) : (
            <>
              <Typography variant="h6">{user.userName}</Typography>
              <Typography variant="body2" color="textSecondary">Email: {user.email}</Typography>
            </>
          )}
        </Box>
        <Box mt={2} display="flex" justifyContent="flex-start">
          {editMode ? (
            <Button variant="contained" color="primary" onClick={handleSave} sx={{ mr: 1 }}>
              Save
            </Button>
          ) : (
            <Button variant="outlined" color="primary" onClick={() => setEditMode(true)} sx={{ mr: 1 }}>
              Edit Profile
            </Button>
          )}
        </Box>
      </Box>
      
      {updateError && <Alert severity="error">{updateError}</Alert>}
    </Box>
  );
};

export default PersonalArea;