import Link from "next/link";
import Image from "next/image";

const HeaderIcon = () => {
  return (
    <Link href="/" className="flex items-center gap-2 px-2 py-1.5" scroll={false}>
      <Image src="/icon.png" alt="Hyriki logo" width={30} height={30} className="rounded-md" />
      <span className="text-lg font-bold text-foreground cursor-pointer">Hyriki</span>
    </Link>
  );
};

export default HeaderIcon;