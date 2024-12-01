// "use client";

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { useGameState } from "@/context/game-state";
// import Image from "next/image";
// import { useRouter } from "next/navigation";
// import { useEffect } from "react";

// const Admin = () => {
//   const { gameState } = useGameState();
//   const router = useRouter();

//   useEffect(() => {
//     if (gameState.song) {
//       router.push("/results");
//     }
//   }, [gameState.song, router]);

//   return (
//     <div className="min-h-screen w-full flex justify-center items-center">
//       <div className="flex flex-wrap gap-10">
//         {gameState.submittedDrawings.map((drawing, index) => (
//           <Card key={index} className="">
//             <CardHeader>
//               <CardTitle>Player: {drawing.nickname}</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="w-[300px] h-[300px] aspect-square border rounded-lg bg-white shadow-md">
//                 <Image
//                   src={drawing.imageData}
//                   alt={`Drawing ${index + 1}`}
//                   width={300}
//                   height={300}
//                   className="object-contain rounded-lg w-full max-h-full aspect-square"
//                 />
//               </div>
//             </CardContent>
//           </Card>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Admin;
