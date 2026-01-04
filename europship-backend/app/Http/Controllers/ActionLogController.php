<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ActionLog;

class ActionLogController extends Controller
{
    /**
     * Enregistrer une nouvelle action.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id' => 'required|integer',
            'role' => 'required|string',
            'action_type' => 'required|string',
            'entity_type' => 'required|string',
            'entity_id' => 'nullable|integer',
            'previous_value' => 'nullable|string',
            'new_value' => 'nullable|string',
        ]);

        $data['ip_address'] = $request->ip();
        $data['user_agent'] = $request->userAgent();
        $data['created_at'] = now();

        ActionLog::create($data);

        return response()->json(['message' => 'Action logguée']);
    }

    /**
     * Afficher la liste des actions.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $query = ActionLog::query();

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->has('from')) {
            $query->where('created_at', '>=', $request->from);
        }
        if ($request->has('to')) {
            $query->where('created_at', '<=', $request->to);
        }

        $logs = $query->orderByDesc('created_at')->paginate(50);

        return response()->json($logs);
    }
}
