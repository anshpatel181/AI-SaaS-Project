import { useAuth } from '@clerk/clerk-react';
import { FileText, Sparkles } from 'lucide-react';
import { useState } from 'react'
import axios from "axios"
import toast from 'react-hot-toast';
import { ButtonLoader } from '../components/ButtonLoader';
import MarkDown from "react-markdown"

export const ReviewResume = () => {
  const [file, setFile] = useState("")
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { getToken } = useAuth()

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true)
      const token = await getToken();

      const formData = new FormData();
      formData.append('resume', file)

      const { data } = await axios.post(BASE_URL + '/api/ai/review-resume', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (data.success) {
        setContent(data.content)
        setIsLoading(false)
        setFile("")
        toast.success("Resume Reviewed successfully")
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error)
      console.log(error);
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700'>
      <form onSubmit={onSubmitHandler} className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200'>
        <div className='flex items-center gap-3'>
          <Sparkles className='w-6 text-[#00DA83]' />
          <h1 className='text-xl font-semibold'>Resume Review</h1>
        </div>
        <p className='mt-6 text-sm font-medium'>Upload Resume</p>
        <input type="file" accept='application/pdf' onChange={(e) => setFile(e.target.files[0])} className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 text-gray-600' />
        <p className='mt-1 text-xs font-light text-gray-500'>Supports PDF file only</p>

        <button disabled={isLoading} className='w-full flex justify-center items-center gap-2 bg-linear-to-r from-[#00DA83] to-[#009BB3] text-white px-4 py-2 mt-4 text-sm rounded-lg cursor-pointer'>
          {
            isLoading && (
              <ButtonLoader />
            )
          }
          <FileText className='w-5' />
          Review Resume</button>
      </form>

      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 max-h-150'>
        <div className='flex items-center gap-3'>
          <FileText className='w-5 h-5 text-[#00DA83]' />
          <h1 className='text-xl font-semibold'>Analysis Results</h1>
        </div>

        {content !== "" ? (
          <div className='reset-tw mt-3 h-full overflow-y-scroll text-sm text-slate-600'>
            <MarkDown>{content}</MarkDown>
          </div>
        ) : (
          <div className='flex-1 flex justify-center items-center'>
            <div className='text-sm flex flex-col items-center gap-5 text-gray-400' >
              <FileText className='w-9 h-9' />
              <p>Upload an resume and click "Review Resume" to get started</p>
            </div>
          </div>
        )
        }

      </div>
    </div>
  )
}
