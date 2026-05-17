import { useState } from 'react'
import { Edit, Sparkles } from "lucide-react"
import toast from 'react-hot-toast'
import { useAuth } from '@clerk/clerk-react'
import { ButtonLoader } from '../components/ButtonLoader'
import Markdown from 'react-markdown'
import { useRef } from 'react'
import { useEffect } from 'react'

export const WriteArticle = () => {

  const BASE_URL = import.meta.env.VITE_BASE_URL
  const articleLength = [
    { length: 800, text: 'Short (500-800 words)' },
    { length: 1200, text: 'Medium (800-1200 words)' },
    { length: 1600, text: 'Long (1200+ words)' },
  ]

  const [selectedLength, setSelectedLength] = useState(articleLength[0])
  const [input, setInput] = useState("")
  const { getToken } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [content, setContent] = useState(``)
  const abortControllerRef = useRef(null)                                                 

  useEffect(() => {
    return () => {
      if(abortControllerRef.current) {
        console.log("User left the page! Cancelling the AI stream...");
        abortControllerRef.current.abort();
      }
    }
  }, [])

  const onSubmitHandler = async (e) => {
    e.preventDefault()

    try {
      setIsLoading(true)
      setContent("")  

      const token = await getToken();

      abortControllerRef.current = new AbortController();

      // Use standard fetch instead of axios to read the stream
      const response = await fetch(BASE_URL + '/api/ai/generate-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: `Write an article about ${input} in ${selectedLength.text}`,
          length: selectedLength.length,
        }),
        signal: abortControllerRef.current.signal
      });

      const contentType = response.headers.get("content-type")

      if(contentType && contentType.includes("application/json")) {
        const data = await response.json();

        if(!data.success) {
          throw new Error(data.message);
        }
      }

      if (!response.ok) {
        throw new Error("Failed to generate article or limit reached.");
      }

      // Read the stream chunk-by-chunk
      const reader = response.body.getReader(); // this creates the stream reader for reading incoming chunks
      const decoder = new TextDecoder("utf-8"); //convert binary chunks into readable text

      while (true) { //continuously read incoming AI chunks
        const { value, done } = await reader.read(); // this reads one chunk(binary) from stream and stores it in value 

        if (done) break; // Streaming is finished

        // Decode the raw text and append it to our state so it types out live!
        const chunk = decoder.decode(value, { stream: true }); // converts binary into text
        setContent(prev => prev + chunk);
      }

      setIsLoading(false)
      toast.success("Article Generated Successfully")

    } catch (error) {
      console.log(error);
      toast.error(error.message || "Something went wrong")
      setIsLoading(false)
    }
  }

  return (
    <div className='h-full overflow-y-scroll p-4 sm:p-6 flex items-start flex-wrap gap-4 text-slate-700'>
      <form onSubmit={onSubmitHandler} className='w-full sm:max-w-lg p-4 bg-white rounded-lg border border-gray-200'>
        <div className='flex items-center gap-3'>
          <Sparkles className='w-6 text-[#4A7AFF]' />
          <h1 className='text-xl font-semibold'>Article Configuration</h1>
        </div>
        <p className='mt-6 text-sm font-medium'>Article Topic</p>
        <input value={input} onChange={(e) => setInput(e.target.value)} type="text" className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300' placeholder='The future of artificial intelligence is...' required />
        <p className='mt-4 text-sm font-medium'>Article Length</p>

        <div className='mt-3 flex gap-3 flex-wrap sm:max-w-9/11'>
          {
            articleLength.map((item, index) => (
              <span onClick={() => setSelectedLength(item)} key={index} className={`text-xs px-4 py-1 border rounded-full cursor-pointer ${selectedLength.text === item.text ? 'bg-blue-50 text-blue-700' : 'text-gray-500 border-gray-300'}`} >{item.text}</span>
            ))
          }
        </div>
        <br />
        <button disabled={isLoading} className='w-full flex justify-center items-center gap-2 bg-linear-to-r from-[#226BFF] to-[#65ADFF] text-white px-4 py-2 mt-4 text-sm rounded-lg cursor-pointer'>
          {isLoading && (
            <ButtonLoader />
          )}
          <Edit className='w-5' />
          {isLoading ? "Generating..." : "Generate Article"}</button>
      </form>

      <div className='w-full sm:max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 max-h-[600px]'>
        <div className='flex items-center gap-3'>
          <Edit className='w-5 h-5 text-[#4A7AFF]' />
          <h1 className='text-xl font-semibold'>Generated Article</h1>
        </div>

        {
          <div className='reset-tw mt-3 h-full overflow-y-scroll text-sm text-slate-600'>
            <Markdown>{content}</Markdown>
          </div>
        }

        {
          content === `` && (
            <div className='flex-1 flex justify-center items-center'>
              <div className='text-sm flex flex-col items-center gap-5 text-gray-400' >
                <Edit className='w-9 h-9' />
                <p>Enter a topic and click "Generate article " to get started</p>
              </div>
            </div>
          )
        }
      </div>
    </div>
  )
}
