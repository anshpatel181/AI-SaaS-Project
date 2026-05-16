import { useAuth } from '@clerk/clerk-react'
import axios from 'axios'
import { Scissors, Sparkles } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { ButtonLoader } from '../components/ButtonLoader'

export const RemoveObject = () => {

  const [file, setFile] = useState("")
  const [object, setObject] = useState("")
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const [imageUrl, setImageUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { getToken } = useAuth()

  const onSubmitHandler = async (e) => {
    e.preventDefault()

    try {
      setIsLoading(true)

      const token = await getToken();

      if(object.split(' ').length > 1) {
        return toast.error("Please enter only one object name")
      }

      const formData = new FormData();
      formData.append('image', file)
      formData.append('object', object)
      const { data } = await axios.post(BASE_URL + '/api/ai/remove-image-object', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (data.success) {
        setImageUrl(data.content)
        toast.success(`${object} removed successfully from image`)
        setIsLoading(false)
        setFile("")
        setObject("")
      }
    } catch (error) {
      toast.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700'>
      <form onSubmit={onSubmitHandler} className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200'>

        <div className='flex items-center gap-3'>
          <Sparkles className='w-6 text-[#4A7AFF]' />
          <h1 className='text-xl font-semibold'>Object Removal</h1>
        </div>

        <p className='mt-6 text-sm font-medium'>Upload Image</p>
        <input type="file" accept='image/*' onChange={(e) => setFile(e.target.files[0])} className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 text-gray-600' />

        <p className='mt-6 text-sm font-medium'>Describe object to remove</p>
        <textarea rows={4} value={object} onChange={(e) => setObject(e.target.value)} type="text" className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300' placeholder='e.g., car in the background, tree' required />
        <p className='text-sm font-medium text-gray-500'>Be specific about what you want to remove</p>

        <button disabled={isLoading} className='w-full flex justify-center items-center gap-2 bg-linear-to-r from-[#417DF6] to-[#8E37EB] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer'>
          {isLoading && (
            <ButtonLoader />
          )}
          <Scissors className='w-5' />
          Remove object</button>
      </form>

      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 max-h-150'>
        <div className='flex items-center gap-3'>
          <Scissors className='w-5 h-5 text-[#4A7AFF]' />
          <h1 className='text-xl font-semibold'>Processed Image</h1>
        </div>

        {imageUrl !== "" ? (
          <img src={imageUrl} alt="removed object image" className='mt-3 h-full w-full' />
        ) : (
          <div className='flex-1 flex justify-center items-center'>
            <div className='text-sm flex flex-col items-center gap-5 text-gray-400' >
              <Scissors className='w-9 h-9' />
              <p>Upload an image and describe what to remove</p>
            </div>
          </div>
        )
        }
      </div>
    </div>
  )
}
