import { useAuth } from '@clerk/clerk-react';
import { FileText, Sparkles } from 'lucide-react';
import { useState } from 'react'
import toast from 'react-hot-toast';
import { ButtonLoader } from '../components/ButtonLoader';
import MarkDown from "react-markdown"
import { useRef } from 'react';
import { useEffect } from 'react';

export const ReviewResume = () => {
  const [file, setFile] = useState("")
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { getToken } = useAuth()
  const abortControllerRef = useRef(null)

  useEffect(() => {
    return () => {
      if(abortControllerRef.current) {
        console.log("User left the page! Cancelling the AI stream...");
        abortControllerRef.current.abort();
      }
    }
  }, []);

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true)
      const token = await getToken();

      abortControllerRef.current = new AbortController()
        
      const formData = new FormData();
      formData.append('resume', file)

      const response = await fetch(BASE_URL + '/api/ai/review-resume', {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData,
        signal: abortControllerRef.current.signal
      })

      const contentType = response.headers.get("content-type")

      if(contentType && contentType.includes("application/json")) {
        const data = await response.json();

        if(!data.success) {
          throw new Error(data.message);
        }
      }

      if(!response.ok) {
        throw new Error("Failed to generate response, please try again.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8")

      while(true) {
        const {value, done} = await reader.read();

        if(done) break;

        const chunk = decoder.decode(value, {stream: true})
        setContent(prev => prev + chunk)
      }

      setIsLoading(false)
      toast.success("Resume Reviewed Successfully")
    } catch (error) {
      toast.error(error || "Something went wrong")
      console.log(error);
      setIsLoading(false)
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

      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 max-h-400'>
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
