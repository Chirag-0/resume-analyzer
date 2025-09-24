import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter"

export const meta = ()=> (
    [
        {title: 'Resume Analyzer | Auth'},
        {name:'description',content: 'Log into your account'}
    ]
)

const auth = () => {
    const {isLoading,auth} = usePuterStore();
    const location = useLocation();
    const next = location.search.split('next=')[1];
    const navigate = useNavigate();

    useEffect(()=>{
        if(auth.isAuthenticated) {
            navigate(next);
        }
    }, [auth.isAuthenticated, location, navigate]);


  return (
    <main className="bg-[url('public/images/bg-main.svg')] bg-cover min-h-screen flex items-center justify-center">
        <div className="gradient-border shadow-lg">
            <section className="flex flex-col gap-8 bg-white rounded-2xl p-10">
                <div className="flex flex-col gap-2 items-center text-center">
                    <h1>Welcome</h1>
                    <h2>Login to continue your job journey</h2>
                </div>

                <div>
                    {isLoading ? (
                        <button className="auth-button animate-pulse">
                            <p>Signing you in....</p>
                        </button>
                    ): (
                        <>
                            {auth.isAuthenticated ? (
                                <button className="auth-button animate-pulse" onClick={auth.signOut}>Log Out</button>
                            ):(
                                 <button className="auth-button animate-pulse" onClick={auth.signIn}>Log In</button>
                            )}
                        </>
                    )}
                </div>
            </section>
        </div>
    </main>
  )
}
export default auth