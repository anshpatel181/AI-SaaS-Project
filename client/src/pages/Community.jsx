import { useEffect, useState } from 'react'
import { dummyPublishedCreationData } from '../assets/assets'
import { useAuth, useUser } from "@clerk/clerk-react"
import { Heart } from 'lucide-react'
import axios from "axios"
import toast from 'react-hot-toast'

export const Community = () => {

  const [creations, setCreations] = useState([])
  const { user } = useUser();
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false)

  const fetchCreations = async () => {
    try {

      setIsLoading(true)
      const { data } = await axios.get(BASE_URL + '/api/user/get-published-creations')

      if (data.success) {
        setCreations(data.creations)
        setIsLoading(false)
      } else {
        console.log(data.message);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false)
    }
  }

  const toggleLikeCreation = async (id) => {
    try {
      const token = await getToken();

      const { data } = await axios.post(BASE_URL + '/api/user/toggle-like-creations', { id }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (data.success) {
        toast.success(data.message)
        await fetchCreations()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error)
    }
  }

  useEffect(() => {
    fetchCreations()
  }, [user]);

  return isLoading ? (
    <div className='flex justify-center items-center h-full'>
      <span className='w-10 h-10 my-1 rounded-full border-3 border-primary border-t-transparent animate-spin'>
      </span>
    </div>
  ) : (
    <div className='flex-1 h-full flex flex-col gap-4 p-6'>
      Creations
      <div className='bg-white h-full w-full rounded-xl overflow-y-scroll'>
        {
          creations.map((creation, index) => (
            <div key={index} className='relative group inline-block pl-3 pt-3 w-full sm:max-w-1/2 lg:max-w-1/3'>
              <img src={creation.content} alt="content" className='w-full h-full object-cover rounded-lg' />
              <div className='absolute top-0 bottom-0 right-0 left-3 flex gap-2 items-end justify-end group-hover:justify-between p-3  group-hover:bg-linear-to-b from-transparent to-black/80 text-white rounded-lg  '>
                <p className='text-sm hidden group-hover:block'>
                  {creation.prompt}
                </p>
                <div className='flex gap-1 items-center'>
                  <p>{creation.likes.length}</p>
                  <Heart className={`min-w-5 h-5 hover:scale-110 cursor-pointer ${creation.likes.includes(user.id) ? 'fill-red-500 text-red-600' : 'text-white'}`} onClick={() => toggleLikeCreation(creation.id)} />
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}
