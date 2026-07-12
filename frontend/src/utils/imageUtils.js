// Centralized image URL utility
// This should be imported and used across all components

export const constructImageUrl = (imagePath) => {
    if (!imagePath) return null;

    // If it's already a full URL or blob URL, return as is
    if (imagePath.startsWith('http') || imagePath.startsWith('blob:')) {
        return imagePath;
    }

    // Construct backend URL
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // Clean the path - remove leading slashes
    let cleanPath = imagePath.trim().replace(/^\/+/g, '');

    // Remove 'uploads/' prefix if it already exists to prevent duplication
    if (cleanPath.startsWith('uploads/')) {
        cleanPath = cleanPath.replace(/^uploads\//, '');
    }

    // Encode only the filename to handle spaces while preserving path structure  
    const pathParts = cleanPath.split('/');
    const filename = pathParts.pop();
    const encodedFilename = encodeURIComponent(filename);

    // Reconstruct path with encoded filename
    const finalPath = pathParts.length > 0
        ? `${pathParts.join('/')}/${encodedFilename}`
        : encodedFilename;

    // Return full URL with /uploads/ prefix
    return `${baseUrl}/uploads/${finalPath}`;
};

export default constructImageUrl;
