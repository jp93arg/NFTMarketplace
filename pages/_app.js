import '../styles/globals.css'
import Link from 'next/link'


function MyApp({ Component, pageProps }) {
  return (
    <div>
      <nav className="border-b p-6">
        <p className="text-2xl font-bold"> NFT Marketplace Sample App</p>
        <div className="flex mt-4">
          <Link href="/">
            <a className="mr-4 text-red-500 hover:text-blue-700">Home</a>
          </Link>
          <Link href="/create-item">
            <a className="mr-4 text-red-500 hover:text-blue-700">Sell NFT</a>
          </Link>
          <Link href="/create-auction">
            <a className="mr-4 text-red-500 hover:text-blue-700">Create NFT Auction</a>
          </Link>
          <Link href="/owner-dashboard">
            <a className="mr-4 text-red-500 hover:text-blue-700">Owner Dashboard</a>
          </Link>
          <Link href="/creator-dashboard">
            <a className="mr-4  text-red-500 hover:text-blue-700">Creator Dashboard</a>
          </Link>
          <Link href="/claim-auction">
            <a className="mr-4  text-red-500 hover:text-blue-700">Claim Auctions</a>
          </Link>
        </div>
      </nav>
      <Component {...pageProps} />
    </div>
  )
}

export default MyApp
