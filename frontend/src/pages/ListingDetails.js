import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getListing, startConversation, getListingReviews, addListingReview } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Rating from '../components/common/Rating';

const ListingDetails = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Review-related states
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [userReview, setUserReview] = useState(null);

  // Fetch listing
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

        if (user) {
          const userReview = response.data.reviews.find(r => r.reviewer_id === user.id);
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

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return toast.error('Please enter a review comment');

    try {
      setSubmittingReview(true);
      await addListingReview(id, { rating: userRating, comment: reviewComment });

      const response = await getListingReviews(id);
      setReviews(response.data.reviews);

      const listingResponse = await getListing(id);
      setListing(listingResponse.data.listing);

      setUserHasReviewed(true);
      setUserReview(response.data.reviews.find(r => r.reviewer_id === user.id));
      setShowReviewForm(false);

      toast.success(userHasReviewed ? 'Review updated' : 'Review added');
    } catch (err) {
      console.error('Review submission failed:', err);
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleContactSeller = () => {
    if (!isAuthenticated) {
      toast.info('Please login to contact the seller');
      navigate('/login');
      return;
    }
    setShowContactModal(true);
    setMessage('');
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
    try {
      setSendingMessage(true);
      console.log("Sending message:", {
        recipientId: listing.seller_id,
        initialMessage: message
      });
      
      // Make sure the parameters are correct
      const response = await startConversation(listing.seller_id, message);
      
      setShowContactModal(false);
      toast.success('Message sent successfully');
      
      // Redirect to messages page
      navigate('/messages');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleEditReview = () => {
    setUserRating(userReview.rating);
    setReviewComment(userReview.comment);
    setShowReviewForm(true);
  };

  const getRandomColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryClass = (category) => {
    const classes = {
      'Textbooks': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'Electronics': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'Services': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'Accommodation': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'Other': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return classes[category] || classes['Other'];
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold">Login Required</h2>
        <p className="mb-6">Please log in to view listing details.</p>
        <Link to="/login" className="px-6 py-2 bg-primary-color text-white rounded-lg">Login Now</Link>
      </div>
    );
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8 flex justify-center"><div className="animate-spin h-12 w-12 border-b-2 border-primary-color rounded-full"></div></div>;
  }

  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold">Listing Not Found</h2>
        <Link to="/" className="px-6 py-2 bg-primary-color text-white rounded-lg">Back to Listings</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Listing Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-8 border">
        {/* Top: Image + Info */}
        <div className="md:flex">
          {/* Image Preview */}
          <div className="md:w-1/2 p-4">
            <div className="aspect-w-4 aspect-h-3 mb-4 bg-gray-200 rounded-lg overflow-hidden">
              {listing.images?.length ? (
                <img src={`https://campus-connect-ph1q.onrender.com${listing.images[activeImageIndex]}`} alt={listing.title} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex justify-center items-center text-white text-5xl" style={{ backgroundColor: getRandomColor(listing.title) }}>
                  {getInitials(listing.title)}
                </div>
              )}
            </div>
            {/* Thumbnails */}
            {listing.images?.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {listing.images.map((img, idx) => (
                  <button key={idx} onClick={() => setActiveImageIndex(idx)} className={`w-16 h-16 rounded-md overflow-hidden border-2 ${activeImageIndex === idx ? 'border-primary-color' : 'border-transparent'}`}>
                    <img src={`https://campus-connect-ph1q.onrender.com${img}`} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Content */}
          <div className="md:w-1/2 p-4">
            <h1 className="text-2xl font-bold mb-2">{listing.title}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryClass(listing.category)}`}>{listing.category}</span>
              <span className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">{formatDate(listing.created_at)}</span>
            </div>
            <p className="mb-4 text-lg text-hit-secondary">${listing.price}</p>
            <p className="mb-6 whitespace-pre-line">{listing.description}</p>
            <h3 className="font-medium mb-2">Contact Info</h3>
            <p className="mb-4">{listing.contact}</p>

            {/* Seller Info */}
            <div className="border-t pt-4 mt-4 flex items-center gap-3">
              {listing.seller_profile_pic ? (
                <img src={`https://campus-connect-ph1q.onrender.com${listing.seller_profile_pic}`} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: getRandomColor(listing.seller_name) }}>
                  {getInitials(listing.seller_name)}
                </div>
              )}
              <div>
                <h4 className="font-medium">{listing.seller_name}</h4>
                <p className="text-sm text-gray-500">{listing.seller_email}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-4">
              <button onClick={handleContactSeller} className="px-4 py-2 bg-primary-color text-white rounded-lg">Contact Seller</button>
              <Link to="/" className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">Back</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border">
        <div className="flex justify-between mb-6">
          <h2 className="text-xl font-bold">Reviews</h2>
          {user && user.id !== listing.seller_id && (
            userHasReviewed ? (
              <button onClick={handleEditReview} className="px-4 py-2 bg-primary-color text-white rounded-lg">Edit Your Review</button>
            ) : (
              <button onClick={() => setShowReviewForm(true)} className="px-4 py-2 bg-primary-color text-white rounded-lg">Write a Review</button>
            )
          )}
        </div>

        <div className="mb-6 flex items-center">
          <span className="text-3xl font-bold mr-2">{listing?.ratings?.average != null ? Number(listing.ratings.average).toFixed(1) : '0.0'}</span>
          <Rating value={listing?.ratings?.average || 0} count={listing?.ratings?.count || 0} size="lg" />
        </div>

        {showReviewForm && (
          <form onSubmit={handleSubmitReview} className="mb-8 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <label className="block mb-2 text-sm font-medium">Rating</label>
            <Rating value={userRating} editable onRate={setUserRating} size="lg" />

            <label className="block mt-4 mb-2 text-sm font-medium">Comment</label>
            <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows="4" className="w-full p-2 border rounded"></textarea>

            <div className="flex justify-end mt-4 space-x-3">
              <button type="button" onClick={() => setShowReviewForm(false)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
              <button type="submit" disabled={submittingReview} className="px-4 py-2 bg-primary-color text-white rounded">{submittingReview ? 'Submitting...' : (userHasReviewed ? 'Update Review' : 'Submit Review')}</button>
            </div>
          </form>
        )}

        {reviewsLoading ? (
          <p className="text-center text-gray-500">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-center text-gray-500">No reviews yet</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-t pt-4 mt-4">
              <div className="flex items-start">
                {review.reviewer_pic ? (
                  <img src={`https://campus-connect-ph1q.onrender.com${review.reviewer_pic}`} alt="" className="w-10 h-10 rounded-full mr-3" />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white mr-3" style={{ backgroundColor: getRandomColor(review.reviewer_name) }}>
                    {getInitials(review.reviewer_name)}
                  </div>
                )}
                <div>
                  <h4 className="font-medium">{review.reviewer_name}</h4>
                  <Rating value={review.rating} size="sm" />
                  <p className="text-sm text-gray-500">{formatDate(review.created_at)}</p>
                  <p className="mt-2">{review.comment}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Contact Seller</h3>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows="4" className="w-full mb-4 p-2 border rounded" placeholder="I'm interested in your listing..."></textarea>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowContactModal(false)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
              <button onClick={handleSendMessage} disabled={sendingMessage} className="px-4 py-2 bg-primary-color text-white rounded">{sendingMessage ? 'Sending...' : 'Send Message'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingDetails;
