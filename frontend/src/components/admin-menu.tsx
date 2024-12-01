// "use client";

// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Button } from "@/components/ui/button";
// import { MoreVertical } from "lucide-react";
// import { useGameState } from "@/context/game-state";

// export function AdminMenu() {
//   const { socket, gameState } = useGameState();

//   const handleForceSubmit = () => {
//     // Add force submit logic here
//     console.log("Force submitting all submissions");
//   };

//   const handleKickEveryone = () => {
//     if (socket) {
//       console.log("Kicking everyone");
//       socket.emit("kickEveryone");
//     } else {
//       console.log("Socket not found");
//     }
//   };

//   if (!gameState.isAdmin) {
//     return null;
//   }

//   return (
//     <DropdownMenu>
//       <DropdownMenuTrigger asChild>
//         <Button variant="ghost" size="icon">
//           <MoreVertical className="h-4 w-4" />
//         </Button>
//       </DropdownMenuTrigger>
//       <DropdownMenuContent align="end">
//         <DropdownMenuItem onClick={handleForceSubmit}>
//           Force submit all
//         </DropdownMenuItem>
//         <DropdownMenuItem onClick={handleKickEveryone}>
//           Kick everyone
//         </DropdownMenuItem>
//       </DropdownMenuContent>
//     </DropdownMenu>
//   );
// }
