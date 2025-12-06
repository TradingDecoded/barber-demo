import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import StaffPhotoUpload from "@/components/StaffPhotoUpload";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function UploadPhotoPage({ params }: PageProps) {
  const { token } = await params;

  const staff = await prisma.staff.findUnique({
    where: { photoUploadToken: token },
    include: { demo: true },
  });

  if (!staff) {
    notFound();
  }

  // Check if token is expired
  if (staff.photoUploadExpires && new Date() > staff.photoUploadExpires) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⏰</div>
          <h1 className="text-2xl font-bold text-white mb-2">Link Expired</h1>
          <p className="text-gray-400">
            This upload link has expired. Please ask your shop owner to send a new one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            Upload Your Photo
          </h1>
          <p className="text-gray-400">
            Hi {staff.name}! Upload a profile photo for {staff.demo.shopName}
          </p>
        </div>

        <StaffPhotoUpload staffId={staff.id} token={token} currentPhoto={staff.photoUrl} />
      </div>
    </div>
  );
}