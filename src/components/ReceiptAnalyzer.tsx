import React, { useState } from 'react';
import { Button, Typography, Box, TextField } from '@mui/material';
import itemService from '../services/item-service'; 

interface ReceiptAnalyzerProps {}

const ReceiptAnalyzer: React.FC<ReceiptAnalyzerProps> = () => {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [productList, setProductList] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedImage(event.target.files[0]);
            setProductList(''); // Clear previous results
            setError('');
        }
    };

    const handleSubmit = async () => {
        if (!selectedImage) {
            setError('Please select an image.');
            return;
        }

        setLoading(true);
        setError('');
        setProductList('');

        const formData = new FormData();
        formData.append('receiptImage', selectedImage);

        try {
            const { request } = itemService.analyzeReceipt(formData); // Get the request promise
            const response = await request; // Await the promise to get the AxiosResponse
            setProductList(response.data.products);
        } catch (err: any) {
            setError(err.message || 'Failed to analyze receipt.');
            console.error('Error analyzing receipt:', err);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Box sx={{ mt: 4, p: 3, border: '1px solid #ccc', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
                ניתוח קבלות באמצעות AI
            </Typography>
            <input
                accept="image/*"
                style={{ display: 'none' }}
                id="raised-button-file"
                type="file"
                onChange={handleImageChange}
            />
            <label htmlFor="raised-button-file">
                <Button variant="contained" color="primary" component="span">
                    העלה תמונה
                </Button>
            </label>
            {selectedImage && (
                <Typography variant="subtitle2" sx={{ mt: 1 }}>
                    {`תמונה נבחרה: ${selectedImage.name}`}
                </Typography>
            )}

            <Button
                variant="contained"
                color="secondary"
                onClick={handleSubmit}
                disabled={!selectedImage || loading}
                sx={{ mt: 2 }}
            >
                {loading ? 'אנא המתן...' : 'נתח קבלה'}
            </Button>

            {error && (
                <Typography color="error" sx={{ mt: 2 }}>
                    {error}
                </Typography>
            )}

            {productList && (
                <Box sx={{ mt: 2, border: '1px solid #eee', p: 2, borderRadius: 1 }}>
                    <Typography variant="subtitle1">מוצרים שזוהו:</Typography>
                    <Typography>{productList}</Typography>
                </Box>
            )}
        </Box>
    );
};

export default ReceiptAnalyzer;