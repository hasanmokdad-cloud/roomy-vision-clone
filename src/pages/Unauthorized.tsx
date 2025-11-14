// src/pages/Unauthorized.tsx
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Lock } from "lucide-react";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20 px-6 text-center">
      <div className="max-w-md space-y-6">
        <div className="flex flex-col items-center">
          <div className="p-6 bg-gradient-to-r from-purple-600 via-blue-500 to-emerald-400 rounded-full shadow-md mb-4">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold gradient-text">Access Denied</h1>
          <p className="text-foreground/70 mt-3">
            You don't have permission to view this page.
            <br />
            Please sign in with the correct account or contact your administrator.
          </p>
        </div>

        <div className="flex justify-center mt-6">
          <Button
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-purple-600 via-blue-500 to-emerald-400 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:scale-105 transition-transform"
          >
            <Home className="w-4 h-4 mr-2" /> Go Back Home
          </Button>
        </div>
      </div>
    </div>
  );
}
