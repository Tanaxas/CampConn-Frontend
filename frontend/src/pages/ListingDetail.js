import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getListing, startConversation, getListingReviews, addListingReview } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Rating from '../components/common/Rating';

const ListingDetails = () => {
  // Existing state
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // New state for reviews
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [userReview, setUserReview] = useState(null);
  
  // Fetch listing details
  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const response = await getListing(id);
        setListing(response.data.listing);
      } catch (error) {
        console.error('Error fetching listing:', error);
        toast.error('Failed to load listing details');
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchListing();
    }
  }, [id, isAuthenticated]);
  
  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        const response = await getListingReviews(id);
        setReviews(response.data.reviews);
        
        // Check if user has already reviewed
        if (user) {
          const userReview = response.data.reviews.find(review => review.reviewer_id === user.id);
          if (userReview) {
            setUserHasReviewed(true);
            setUserReview(userReview);
            setUserRating(userReview.rating);
            setReviewComment(userReview.comment);
          }
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setReviewsLoading(false);
      }
    };
    
    if (isAuthenticated && id) {
      fetchReviews();
    }
  }, [id, isAuthenticated, user]);
  
  // Submit review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!reviewComment.trim()) {
      toast.error('Please enter a review comment');
      return;
    }
    
    try {
      setSubmittingReview(true);
      await addListingReview(id, {
        rating: userRating,
        comment: reviewComment
      });
      
      // Refresh reviews
      const response = await getListingReviews(id);
      setReviews(response.data.reviews);
      
      // Update listing with new rating
      const listingResponse = await getListing(id);
      setListing(listingResponse.data.listing);
      
      // Update user review status
      setUserHasReviewed(true);
      setUserReview(response.data.reviews.find(review => review.reviewer_id === user.id));
      
      // Hide form
      setShowReviewForm(false);
      
      toast.success(userHasReviewed ? 'Review updated successfully' : 'Review added successfully');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };
  
  // Format date
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Edit review
  const handleEditReview = () => {
    setUserRating(userReview.rating);
    setReviewComment(userReview.comment);
    setShowReviewForm(true);
  };
  

  
  
  
  return (
    <div className="container mx-auto px-4 py-8">
     
      
      {/* Reviews Section */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Reviews</h2>
          
          {isAuthenticated && listing && user.id !== listing.seller_id && (
            <div>
              {userHasReviewed ? (
                <button
                  onClick={handleEditReview}
                  className="px-4 py-2 bg-primary-color text-white rounded-lg hover:bg-opacity-90"
                >
                  Edit Your Review
                </button>
              ) : (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="px-4 py-2 bg-primary-color text-white rounded-lg hover:bg-opacity-90"
                >
                  Write a Review
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Average Rating */}
        <div className="mb-6">
          <div className="flex items-center">
            <span className="text-3xl font-bold mr-2">
              {listing?.ratings.average ? Number(listing.ratings.average).toFixed(1) : '0.0'}
            </span>
            <div>
              <Rating 
                value={listing?.ratings.average || 0} 
                count={listing?.ratings.count || 0}
                size="lg"
              />
            </div>
          </div>
        </div>
        
        {/* Review Form */}
        {showReviewForm && (
          <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="text-lg font-medium mb-4">
              {userHasReviewed ? 'Update Your Review' : 'Write a Review'}
            </h3>
            
            <form onSubmit={handleSubmitReview}>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rating
                </label>
                <Rating 
                  value={userRating} 
                  editable={true} 
                  onRate={setUserRating}
                  size="lg"
                />
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Your Review
                </label>
                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows="4"
                  placeholder="Share your experience with this product or service..."
                  required
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-2 bg-primary-color text-white rounded hover:bg-opacity-90 disabled:opacity-50"
                >
                  {submittingReview 
                    ? 'Submitting...' 
                    : userHasReviewed ? 'Update Review' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Reviews List */}
        {reviewsLoading ? (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-color mx-auto"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No reviews yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map(review => (
              <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                <div className="flex items-start">
                  {review.reviewer_pic ? (
                    <img 
                      src={`https://campus-connect-ph1q.onrender.com${review.reviewer_pic}`} 
                      alt={review.reviewer_name} 
                      className="w-10 h-10 rounded-full object-cover mr-3"
                    />
                  ) : (
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white mr-3"
                      style={{ backgroundColor: getRandomColor(review.reviewer_name) }}
                    >
                      {getInitials(review.reviewer_name)}
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{review.reviewer_name}</h4>
                        <Rating value={review.rating} size="sm" />
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                    
                    <p className="mt-2 text-gray-700 dark:text-gray-300">{review.comment}</p>
                    
                    {review.reviewer_id === user?.id && (
                      <button
                        onClick={handleEditReview}
                        className="mt-2 text-sm text-primary-color hover:underline"
                      >
                        Edit your review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* ... existing contact modal code ... */}
    </div>
  );
};

export default ListingDetails;