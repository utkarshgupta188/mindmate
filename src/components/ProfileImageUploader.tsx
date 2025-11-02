import React, { useEffect, useRef, useState } from 'react'

type Props = {
  initial: string | null
  onChange: (url: string | null) => void
}

export default function ProfileImageUploader({ initial, onChange }: Props){
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [preview, setPreview] = useState<string | null>(initial)

  useEffect(()=>{
    setPreview(initial)
  }, [initial])

  function pick(){
    inputRef.current?.click()
  }

  function clear(){
    setPreview(null)
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>){
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = typeof reader.result === 'string' ? reader.result : null
      setPreview(url)
      onChange(url)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="p-4 border rounded-xl">
      <div className="flex items-start gap-4">
        <div className="w-24 h-24 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
          {preview ? (
            <img src={preview} alt="profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs text-slate-500">No image</span>
          )}
        </div>
        <div className="space-x-2">
          <button type="button" onClick={pick} className="px-3 py-2 rounded-xl border">Choose image</button>
          {preview && <button type="button" onClick={clear} className="px-3 py-2 rounded-xl border">Remove</button>}
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          <p className="text-xs text-slate-500 mt-2">Images are stored locally in your browser.</p>
        </div>
      </div>
    </div>
  )
}
