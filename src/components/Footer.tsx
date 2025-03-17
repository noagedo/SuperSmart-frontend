import React from "react";
import { Box, Container, Typography, Link, IconButton } from "@mui/material";
import { Facebook, Instagram, Twitter, LinkedIn } from "@mui/icons-material";

const Footer: React.FC = () => {
	return (
		<Box
			component="footer"
			sx={{
				backgroundColor: '#FF4081',
				color: "white",
				paddingY: 3,
				marginTop: "auto",
			}}
		>
			<Container maxWidth="lg">
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						flexWrap: "wrap",
						textAlign: "center",
					}}
				>
					
					<Box sx={{ display: "flex", gap: 2 }}>
						<Link href="/about" color="inherit" underline="hover">
							About
						</Link>
						<Link href="/contact" color="inherit" underline="hover">
							Contact
						</Link>
						<Link href="/privacy" color="inherit" underline="hover">
							Privacy Policy
						</Link>
					</Box>

					
					<Box>
						<IconButton href="https://facebook.com" target="_blank" color="inherit">
							<Facebook />
						</IconButton>
						<IconButton href="https://instagram.com" target="_blank" color="inherit">
							<Instagram />
						</IconButton>
						<IconButton href="https://twitter.com" target="_blank" color="inherit">
							<Twitter />
						</IconButton>
						<IconButton href="https://linkedin.com" target="_blank" color="inherit">
							<LinkedIn />
						</IconButton>
					</Box>

					
					<Typography variant="body2" color="white">
						&copy; {new Date().getFullYear()} Your Company. All rights reserved.
					</Typography>
				</Box>
			</Container>
		</Box>
	);
};

export default Footer;
