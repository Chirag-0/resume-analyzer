import { Link } from "react-router"
import { usePuterStore } from "~/lib/puter"

const Navbar = () => {
  const {auth} = usePuterStore();
  return (
    <nav className="navbar">
        <Link to='/'>
            <p className="text-xl sm:text-2xl font-bold text-gradient mr-[3.5rem] sm:mr-[50vw]">Resume Analyzer</p>
        </Link>
        <Link to='/upload' className="primary-button w-fit text-[10px] ">Upload Resume</Link>

        {auth.isAuthenticated && <button onClick={auth.signOut} className="primary-button w-fit text-[10px]">Log out</button>}
    </nav>
  )
}
export default Navbar