// Always-solid white strip above the nav — distinct from the header's own
// overlay/solid states, and from the footer's "in partnership with" logos.
// Per Stacey Bailie's 2026-08-04 email: GDEnv (left)/GGT2030 (right) with
// partner logos like UJ PEETS in between.
export default function PartnerLogosBanner() {
  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex h-20 w-full items-center justify-between bg-white px-[5%]">
      <img src="/GautengProvince-logo.png" alt="Gauteng Provincial Government" className="h-12 w-auto" />
      <img src="/peets-logo.png" alt="UJ PEETS" className="h-10 w-auto" />
      <img src="/ggt2030-logo.png" alt="Gauteng Growth and Development Strategy 2030" className="h-12 w-auto" />
    </div>
  )
}
