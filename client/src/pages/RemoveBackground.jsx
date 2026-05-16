import axios from 'axios';
import { Eraser, Sparkles } from 'lucide-react';
import { useState } from 'react'
import toast from 'react-hot-toast';
import { ButtonLoader } from '../components/ButtonLoader';
import { useAuth } from '@clerk/clerk-react';

export const RemoveBackground = () => {
  const [file, setFile] = useState("")
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const [imageUrl, setImageUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { getToken } = useAuth()

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please select an image")
      return;
    }

    const img = new Image()
    img.src = URL.createObjectURL(file)

    img.onload = async () => {

      const megapixels = (img.width * img.height) / 1000000;

      if (megapixels > 25) {
        toast.error(`Image too large (${megapixels.toFixed(1)} MP). Please upload an image below 25 MP.`);
        return;
      }

      try {
        setIsLoading(true)
        const token = await getToken();
        const formData = new FormData();
        formData.append('image', file)

        const { data } = await axios.post(BASE_URL + '/api/ai/remove-image-background', formData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (data.success) {
          setImageUrl(data.content)
          setFile("")
          setIsLoading(false)
          toast.success("Background removed Successfully")
        }
      } catch (error) {
        toast.error(error.response?.data?.message || error.message)
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700'>
      <form onSubmit={onSubmitHandler} className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200'>
        <div className='flex items-center gap-3'>
          <Sparkles className='w-6 text-[#FF4938]' />
          <h1 className='text-xl font-semibold'>Background Removal</h1>
        </div>
        <p className='mt-6 text-sm font-medium'>Upload image</p>
        <input type="file" accept='image/*' onChange={(e) => setFile(e.target.files[0])} className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 text-gray-600' />
        <p className='mt-1 text-xs font-light text-gray-500'>Supports JPG, PNG, and other image formats</p>

        <button disabled={isLoading} className='w-full flex justify-center items-center gap-2 bg-linear-to-r from-[#F6AB41] to-[#FF4938] text-white px-4 py-2 mt-4 text-sm rounded-lg cursor-pointer'>
          {isLoading && (
            <ButtonLoader />
          )}
          <Eraser className='w-5' />
          Remove Background</button>
      </form>

      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96'>
        <div className='flex items-center gap-3'>
          <Eraser className='w-5 h-5 text-[#FF4938]' />
          <h1 className='text-xl font-semibold'>Processed Image</h1>
        </div>

        {
          imageUrl !== "" ? (
            <img src={imageUrl} alt="Background removed" className='mt-3 w-full h-full' />
          ) :
            (
              <div className='flex-1 flex justify-center items-center'>
                <div className='text-sm flex flex-col items-center gap-5 text-gray-400' >
                  <Eraser className='w-9 h-9' />
                  <p>Upload an image and click "Remove Background" to get started</p>
                </div>
              </div>
            )
        }
      </div>
    </div>
  )
}
