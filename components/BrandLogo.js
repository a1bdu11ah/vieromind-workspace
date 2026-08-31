import Image from "next/image";

export default function BrandLogo({ compact = false }) {
  return <>
    <span className="brand-logo-image"><Image src="/vieromind-logo.png" alt="" width={44} height={44} priority /></span>
    {!compact && <span className="brand-wordmark">Viero<span>Mind</span></span>}
  </>;
}
