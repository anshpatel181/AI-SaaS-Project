import { Check } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth, useUser } from '@clerk/clerk-react'

export const Plan = () => {

    const BASE_URL = import.meta.env.VITE_BASE_URL
    const { getToken } = useAuth()
    const { user } = useUser();
    const plan = user?.publicMetadata?.plan;

    const handlePayment = async () => {
        try {

            const token = await getToken();
            const { data: orderData } = await axios.post(BASE_URL + "/api/user/create-razorpay-order", {}, 
                {headers: { Authorization: `Bearer ${token}` }}
            )

            if (!orderData.success) {
                toast.error(orderData.message || "Failed to create order")
                return;
            }

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderData.order.amount,
                currency: "INR",
                name: "AI SaaS Project",
                description: "Premium Plan Upgrade",
                order_id: orderData.order.id,

                handler: async function (response) {
                    try {
                        toast.loading("Verifying Payment...")
                        const token = await getToken();
                        const { data: verifyData } = await axios.post(BASE_URL + '/api/user/verify-razorpay-payment',
                            {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            },
                            {
                                headers: { Authorization: `Bearer ${token}` }
                            }
                        )

                        toast.dismiss()

                        if (verifyData.success) {
                            toast.success("Welcome to Premium!")
                            window.location.reload();
                        } else {
                            toast.error(verifyData.message)
                        }
                    } catch (error) {
                        toast.dismiss()
                        toast.error("Payment verification failed")
                    }
                },

                theme: {
                    color: '#4A7AFF'
                }
            }

            const rzp = new window.Razorpay(options)

            rzp.on('payment.failed', function (response) {
                toast.error("Payment Failed or Cancelled")
            })

            rzp.open()
        } catch (error) {
            console.log(error);
            toast.error(error.message)
        }
    }

    return (
        <div className='max-w-5xl mx-auto my-20 px-6'>

            <div className='text-center'>
                <h2 className='text-slate-700 text-[42px] font-semibold'>
                    Choose Your Plan
                </h2>

                <p className='text-gray-500 max-w-2xl mx-auto mt-3'>
                    Start for free and unlock premium AI tools with unlimited access.
                </p>
            </div>

            <div className='grid md:grid-cols-2 gap-8 mt-14'>

                <div className={`${plan === "free" ? "border-2 border-blue-500 shadow-lg relative overflow-hidden" : "border border-gray-200 rounded-2xl"} p-8 rounded-2xl bg-white`}>

                    <div className='flex justify-between items-center'>
                        <h3 className='text-2xl font-semibold'>Free</h3>

                        {plan === "free" &&
                            <span className='bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full'>
                                Current Plan
                            </span>
                        }
                    </div>

                    <h2 className='text-5xl font-bold mt-6'>
                        ₹0
                    </h2>

                    <p className='text-gray-500 mt-2'>
                        Perfect for getting started
                    </p>

                    <ul className='space-y-4 mt-8'>

                        <li className='flex items-center gap-3'>
                            <Check size={18} />
                            10 Free AI generations
                        </li>

                        <li className='flex items-center gap-3'>
                            <Check size={18} />
                            Article Generation
                        </li>

                        <li className='flex items-center gap-3'>
                            <Check size={18} />
                            Title Generation
                        </li>

                    </ul>
                </div>


                <div className={`${plan === "premium" ? "border-2 border-blue-500 shadow-lg relative overflow-hidden" : "border border-gray-200 rounded-2xl"} rounded-2xl p-8 bg-white`}>

                    <div className='absolute top-0 right-0 bg-blue-500 text-white text-xs px-4 py-1 rounded-bl-xl'>
                        Popular
                    </div>

                    <div className='flex justify-between items-center'>
                        <h3 className='text-2xl font-semibold'>
                            Premium
                        </h3>

                        {plan === "premium" &&
                            <span className='bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full'>
                                Current Plan
                            </span>
                        }
                    </div>

                    <h2 className='text-5xl font-bold mt-6'>
                        ₹999
                        <span className='text-lg text-gray-500 font-medium'>
                            /month
                        </span>
                    </h2>

                    <p className='text-gray-500 mt-2'>
                        Unlock all premium AI features
                    </p>

                    <ul className='space-y-4 mt-8'>

                        <li className='flex items-center gap-3'>
                            <Check size={18} />
                            Unlimited AI generations
                        </li>

                        <li className='flex items-center gap-3'>
                            <Check size={18} />
                            AI Article Generation
                        </li>

                        <li className='flex items-center gap-3'>
                            <Check size={18} />
                            AI Image Generation
                        </li>

                        <li className='flex items-center gap-3'>
                            <Check size={18} />
                            Resume Review
                        </li>

                        <li className='flex items-center gap-3'>
                            <Check size={18} />
                            Remove Background
                        </li>

                        <li className='flex items-center gap-3'>
                            <Check size={18} />
                            AI Object Removal
                        </li>

                        <li className='flex items-center gap-3'>
                            <Check size={18} />
                            Priority Access
                        </li>

                    </ul>

                    {plan === "free" &&
                        <button
                            onClick={handlePayment}
                            className='w-full mt-10 bg-blue-600 hover:bg-blue-700 transition text-white py-3 rounded-xl font-medium cursor-pointer'
                        >
                            Upgrade to Premium
                        </button>
                    }
                </div>

            </div>
        </div>
    )
}