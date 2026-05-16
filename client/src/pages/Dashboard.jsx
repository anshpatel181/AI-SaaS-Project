import { useEffect, useState } from 'react'
import { Gem, Sparkles } from 'lucide-react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { CreationItem } from '../components/CreationItem'
import axios from 'axios'
import toast from "react-hot-toast"

export const Dashboard = () => {

  const [creations, setCreations] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const { getToken } = useAuth()
  const { user } = useUser()

  const BASE_URL = import.meta.env.VITE_BASE_URL
  const plan = user?.publicMetadata?.plan || "free"

  const getDashboardData = async () => {
    try {

      setIsLoading(true)

      const token = await getToken();
      
      const { data } = await axios.get(BASE_URL + '/api/user/get-user-creations', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (data.success) {
        setCreations(data.creations)
        setIsLoading(false)
      } else {
        console.log(data.message);
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    getDashboardData()
  }, [])

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();

      // 1. Ask backend to create an order
      const { data: orderData } = await axios.post(
        BASE_URL + '/api/user/create-razorpay-order',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!orderData.success) {
        toast.error(orderData.message || "Failed to create order");
        setIsLoading(false);
        return;
      }

      // 2. Open Razorpay Checkout Popup
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Gets the key from .env
        amount: orderData.order.amount,
        currency: "INR",
        name: "AI SaaS Project",
        description: "Premium Plan Upgrade",
        order_id: orderData.order.id,
        
        // 3. This runs automatically if payment is successful
        handler: async function (response) { // handler is the razorpay callback function and response is a payement details which is automatically sended by razorpay
          try {
            toast.loading("Verifying payment...");
            console.log(response) ;
            const { data: verifyData } = await axios.post(
              BASE_URL + '/api/user/verify-razorpay-payment',
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.dismiss(); // clear loading toast

            console.log(verifyData);
            
            if (verifyData.success) {
              toast.success("Welcome to Premium!");
              // Refresh the page to update the Clerk UI state
              window.location.reload();
            } else {
              toast.error(verifyData.message);
            }
          } catch (error) {
            toast.dismiss();
            toast.error("Payment verification failed");
          }
        },
        theme: {
          color: "#4A7AFF", // Matches your blue theme
        },
      };

      // Open the Razorpay Window
      const rzp = new window.Razorpay(options); //earlier we have added <script src="https://checkout.razorpay.com/v1/checkout.js"></script> inside index.html which download and executes frontend js sdk of razorpay and add that sdk (razorpay class) to window object globally, now new winodw.Razorpay(options) creates a new razorpay checkout object instance of this Razorpay class with these options and assign that object instance which has methods like rzp.open(), rzp.on()
      rzp.on('payment.failed', function (response) { // rzp.on registers an event called if payment.failed happens in future run this callback function in which this toast.error runs
        toast.error("Payment Failed or Cancelled");
      });
      rzp.open(); // now open the razorpay checkout modal 

    } catch (error) {
      console.log(error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return isLoading ? (
    <div className='flex justify-center items-center h-full'>
      <span className='w-10 h-10 my-1 rounded-full border-3 border-primary border-t-transparent animate-spin'>
      </span>
    </div>
  ) : (
    <div className='h-full overflow-y-scroll p-6'>
      <div className='flex justify-start gap-4 flex-wrap'>
        <div className='flex justify-between items-center w-72 p-4 px-6 bg-white rounded-xl border border-gray-200'>
          <div className='text-slate-600'>
            <p className='text-sm'>Total Creations</p>
            <h2 className='text-xl font-semibold'>{creations.length}</h2>
          </div>
          <div className='w-10 h-10 rounded-lg bg-linear-to-br from-[#3588F2] to-[#0BB0B7] text-white flex justify-center items-center'>
            <Sparkles className='w-5 text-white' />
          </div>
        </div>

        <div className='flex justify-between items-center w-80 p-4 px-6 bg-white rounded-xl border border-gray-200'>
          <div className='text-slate-600'>
            <p className='text-sm'>Active Plan</p>
            <h2 className='text-xl font-semibold'>
              {plan === "premium" ? "Premium" : "Free"}
            </h2>

            {
              plan === "free" ?
                <button onClick={handlePayment} className='mt-2 text-xs bg-linear-to-r from-[#226BFF] to-[#65ADFF] text-white px-3 py-1 rounded-md cursor-pointer hover:opacity-90'>
                  Upgrade to Premium
                </button>
                :
                <span className='text-xs text-green-500 font-medium'>Unlimited Access</span>
            }
          </div>
          <div className='w-10 h-10 rounded-lg bg-linear-to-br from-[#FF61C5] to-[#9E53EE] text-white flex justify-center items-center'>
            <Gem className='w-5 text-white' />
          </div>
        </div>
      </div>

      <div className='space-y-3'>
        <p className='mt-6 mb-4'>Recent Creations</p>
        {
          creations.map((item) => <CreationItem key={item.id} item={item} />)
        }
      </div>
    </div>
  )
}
