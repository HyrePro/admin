import Link from "next/link";
import Image from "next/image";

const HeaderIcon = () => {
  return (
    <Link href="/" className="flex items-center gap-2 px-2 py-1.5">
      <Image src="/icon.png" alt="HyrePro logo" width={30} height={30} className="rounded-md" />
      <span className="text-lg font-bold text-foreground cursor-pointer">HyrePro</span>
    </Link>
  );
};

export default HeaderIcon;

