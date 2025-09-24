import { prepareInstructions } from "constants/index";
import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router";
import FileUploader from "~/components/FileUploader";
import Navbar from "~/components/Navbar"
import { convertPdfToImage } from "~/lib/pdf2img";
import { usePuterStore } from "~/lib/puter";
import { generateUUID } from "~/lib/utils";

// Define the shape of the custom API error object
interface CustomApiError {
  success: boolean;
  error: {
    delegate: string;
    message: string;
    code: string;
  };
}

// A type guard to check if an object matches the CustomApiError interface
function isCustomApiError(obj: any): obj is CustomApiError {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'success' in obj &&
    'error' in obj &&
    typeof obj.error.message === 'string'
  );
}

const upload = () => {
    const [isProcessing,setIsProcessing] = useState(false);
    const [statusText,setStatusText] = useState('');
    const[file,setFile] = useState<File | null>(null); 
    const {ai,kv,fs} = usePuterStore();
    const navigate = useNavigate();

    const handleFileSelect = (file:File | null) => {
        setFile(file);
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget.closest('form');
        if(!form) return;
        const formData = new FormData(form);

        const companyName = formData.get('company-name') as string;
        const jobDescription = formData.get('job-description') as string;
        const jobTitle = formData.get('job-title') as string;

        console.log({
            companyName,jobDescription,jobTitle,file
        });

        if(!file) return;

        handleAnalyze({companyName,jobDescription,jobTitle,file});
        
    }

    const handleAnalyze = async ({companyName,jobDescription,jobTitle,file}: { companyName: string, jobTitle: string, jobDescription: string, file: File}) => {
        setIsProcessing(true);
        setStatusText('Uploading file...')
        const uploadFile = await fs.upload([file])
        if(!uploadFile){
            return setStatusText('Error: Failed to upload file')
        }
        setStatusText('Converting to image');
        const imageFile = await convertPdfToImage(file);
        
        if(!imageFile){
            return setStatusText('Error: Failed to convert to pdf to image')
        }

        setStatusText('Uploading the image')
        let uploadImage = null;

        if (imageFile.file) {
        uploadImage = await fs.upload([imageFile.file]);
        // console.log(uploadImage);
        } else {
        console.error("No file selected");
        }
        if(!uploadImage){
            return setStatusText('Error: Failed to upload image')
        }
        setStatusText('Preparing data...');

        const uuid = generateUUID();

        const data = {
            id: uuid,
            resumePath: uploadFile.path,
            imagePath: uploadImage.path,
            companyName,jobTitle,jobDescription,
            feedback:'',
        }
        
        await kv.set(`resume:${uuid}`, JSON.stringify(data));

        setStatusText('Analyzing...');
        
        try{
        const feedback = await ai.feedback(
            uploadFile.path,
            prepareInstructions({jobTitle,jobDescription}),
        )

         if(!feedback){
            return setStatusText('Error: Failed to analyze resume')
        }

        const feedbackText = typeof feedback.message.content === 'string' ?
        feedback.message.content : feedback.message.content[0].text;
         try{
            data.feedback = JSON.parse(feedbackText);
        }catch{
            data.feedback = feedbackText;
        }
        await kv.set(`resume:${uuid}`,JSON.stringify(data));
         setStatusText('Analysis completed, redirecting...')
        // console.log(data);
        
        navigate(`/resume/${uuid}`)
        }catch(e){
            if (e instanceof Error) {
                console.error('An unexpected error occurred:', e.message);
            } else if(isCustomApiError(e)){
                // Handle cases where the error is not a standard Error object
                console.error('An API error occurred:', e.error.message);
                setStatusText("Limit exceed try after some time");
            }else{
                console.error('An unknown error occurred:', e);
            } 
        }


        
       
       
       
    }

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    <Navbar/>
    <section className="main-section">
        <div className="page-heading">
            <h1>Smart feedback for your dream job</h1>

            {isProcessing ? (
                <>
                    <h2>{statusText}</h2>
                    <img src="/images/resume-scan.gif" alt="gif"
                    className="w-full"
                    />
                </>
            ): (
                <h2>Drop your resume for an ATS score and improvement tips.</h2>
            )}

            {!isProcessing && (
                <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-8 mt-8">
                    <div className="form-div">
                        <label htmlFor="company-name">
                            Compnay name
                        </label>
                        <input type="text" name="company-name" placeholder="Company name" id="company-name"/>
                    </div>
                    <div className="form-div">
                        <label htmlFor="job-title">Job Title</label>
                        <input type="text" name="job-title" placeholder="Job Title" id="job-title" />
                    </div>
                    <div className="form-div">
                        <label htmlFor="job-description">Job Description</label>
                        <textarea rows={5} name="job-description" placeholder="Job Description" id="job-description" />
                    </div>

                    <div className="form-div">
                        <label htmlFor="uploader">Upload Resume</label>
                        <FileUploader file={file} onFileSelect={handleFileSelect}/>
                    </div>
                    <button className="primary-button">Analyze Resume</button>
                </form>
            )}
        </div>

    </section>
    </main>
  )
}
export default upload