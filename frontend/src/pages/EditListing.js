import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { getListing, updateListing } from '../services/api';
import { useAuth } from '../context/AuthContext';

const EditListing = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [previewImages, setPreviewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [replaceImages, setReplaceImages] = useState(false);
  
  // Fetch listing details
  useEffect(() => {
    const fetchListing = async () => {
      try {
        setInitialLoading(true);
        const response = await getListing(id);
        const listing = response.data.listing;
        
        // Check if user is authorized to edit
        if (listing.seller_id !== user.id && user.type !== 'admin') {
          toast.error('You are not authorized to edit this listing');
          navigate('/');
          return;
        }
        
        // Set existing images
        setExistingImages(listing.images || []);
        
        // Set form initial values
        formik.setValues({
          title: listing.title,
          category: listing.category,
          price: listing.price,
          description: listing.description,
          contact: listing.contact,
          images: []
        });
      } catch (error) {
        console.error('Error fetching listing:', error);
        toast.error('Failed to load listing details');
        navigate('/');
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchListing();
  }, [id, user, navigate]);
  
  // Form validation schema
  const validationSchema = Yup.object({
    title: Yup.string()
      .required('Title is required')
      .min(5, 'Title should be at least 5 characters')
      .max(100, 'Title should not exceed 100 characters'),
    category: Yup.string()
      .required('Category is required'),
    price: Yup.number()
      .required('Price is required')
      .min(0, 'Price cannot be negative')
      .typeError('Price must be a number'),
    description: Yup.string()
      .required('Description is required')
      .min(20, 'Description should be at least 20 characters'),
    contact: Yup.string()
      .required('Contact information is required')
  });
  
  // Initialize form
  const formik = useFormik({
    initialValues: {
      title: '',
      category: '',
      price: '',
      description: '',
      contact: '',
      images: []
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        
        // Update listing
        await updateListing(id, {
          title: values.title,
          category: values.category,
          price: values.price,
          description: values.description,
          contact: values.contact,
          images: values.images
        }, replaceImages);
        
        toast.success('Listing updated successfully!');
        navigate(`/listings/${id}`);
      } catch (error) {
        console.error('Error updating listing:', error);
        toast.error(error.response?.data?.message || 'Failed to update listing');
      } finally {
        setLoading(false);
      }
    }
  });
  
  // Handle image uploads
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate files
    const validFiles = files.filter(file => {
      // Check file type
      if (!file.type.match('image.*')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB size limit`);
        return false;
      }
      
      return true;
    });
    
    // Check total number of images
    const totalImages = replaceImages 
      ? validFiles.length 
      : existingImages.length + formik.values.images.length + validFiles.length;
      
    if (totalImages > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    
    // Create preview URLs
    const newPreviews = [];
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target.result);
        if (newPreviews.length === validFiles.length) {
          setPreviewImages([...previewImages, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Add to form values
    formik.setFieldValue('images', [...formik.values.images, ...validFiles]);
    
    // If first image is being added after checking replace, set flag
    if (replaceImages && formik.values.images.length === 0 && validFiles.length > 0) {
      setReplaceImages(true);
    }
  };
  
  // Remove an uploaded image
  const removeUploadedImage = (index) => {
    const newImages = [...formik.values.images];
    const newPreviews = [...previewImages];
    
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    
    formik.setFieldValue('images', newImages);
    setPreviewImages(newPreviews);
  };
  
  // Toggle replace images
  const handleReplaceImages = (e) => {
    setReplaceImages(e.target.checked);
  };
  
  if (initialLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-color"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Listing</h1>
        
        <form onSubmit={formik.handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              className={`w-full px-3 py-2 border ${
                formik.touched.title && formik.errors.title
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-600'
              } rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.title}
            />
            {formik.touched.title && formik.errors.title && (
              <p className="mt-1 text-sm text-red-600">{formik.errors.title}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="category" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              className={`w-full px-3 py-2 border ${
                formik.touched.category && formik.errors.category
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-600'
              } rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.category}
            >
              <option value="Textbooks">Textbooks</option>
              <option value="Electronics">Electronics</option>
              <option value="Services">Services</option>
              <option value="Accommodation">Accommodation</option>
              <option value="Other">Other</option>
            </select>
            {formik.touched.category && formik.errors.category && (
              <p className="mt-1 text-sm text-red-600">{formik.errors.category}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="price" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Price (USD) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="price"
              name="price"
              min="0"
              step="0.01"
              className={`w-full px-3 py-2 border ${
                formik.touched.price && formik.errors.price
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-600'
              } rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.price}
            />
            {formik.touched.price && formik.errors.price && (
              <p className="mt-1 text-sm text-red-600">{formik.errors.price}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows="4"
              className={`w-full px-3 py-2 border ${
                formik.touched.description && formik.errors.description
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-600'
              } rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.description}
            ></textarea>
            {formik.touched.description && formik.errors.description && (
              <p className="mt-1 text-sm text-red-600">{formik.errors.description}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="contact" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Contact Information <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="contact"
              name="contact"
              className={`w-full px-3 py-2 border ${
                formik.touched.contact && formik.errors.contact
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-600'
              } rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.contact}
            />
            {formik.touched.contact && formik.errors.contact && (
              <p className="mt-1 text-sm text-red-600">{formik.errors.contact}</p>
            )}
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Images
            </label>
            
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <h3 className="font-medium">Current Images</h3>
                  <div className="ml-4 flex items-center">
                    <input
                      type="checkbox"
                      id="replaceImages"
                      checked={replaceImages}
                      onChange={handleReplaceImages}
                      className="mr-2"
                    />
                    <label htmlFor="replaceImages" className="text-sm text-gray-700 dark:text-gray-300">
                      Replace all images
                    </label>
                  </div>
                </div>
                
                <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 ${replaceImages ? 'opacity-30' : ''}`}>
                  {existingImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={`https://campus-connect-ph1q.onrender.com${image}`} 
                        alt={`Image ${index + 1}`} 
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Upload New Images */}
            <div className="mt-4">
              <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label htmlFor="images" className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-primary-color hover:text-primary-color focus-within:outline-none">
                      <span>{replaceImages ? 'Upload new images' : 'Upload additional images'}</span>
                      <input 
                        id="images" 
                        name="images" 
                        type="file" 
                        accept="image/*" 
                        multiple
                        className="sr-only" 
                        onChange={handleImageUpload}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              </div>
              
              {/* New Image Previews */}
              {previewImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {previewImages.map((preview, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={preview} 
                        alt={`New Image ${index + 1}`} 
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeUploadedImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Link
              to={`/listings/${id}`}
              className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </Link>
            
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-white bg-primary-color hover:bg-opacity-90 rounded-lg disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </span>
              ) : (
                'Update Listing'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditListing;
