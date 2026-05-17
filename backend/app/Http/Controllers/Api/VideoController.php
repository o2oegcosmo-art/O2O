<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VideoProject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class VideoController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        $projects = VideoProject::where('tenant_id', $tenantId)->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $projects
        ]);
    }

    public function store(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'props' => 'required|array',
            'template_id' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $project = VideoProject::updateOrCreate(
            ['id' => $request->id, 'tenant_id' => $tenantId],
            [
                'name' => $request->name,
                'props' => $request->props,
                'template_id' => $request->template_id ?? 'salon-intro',
                'status' => $request->status ?? 'draft'
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ المشروع بنجاح',
            'data' => $project
        ]);
    }

    public function destroy(VideoProject $videoProject)
    {
        $videoProject->delete();
        return response()->json(['success' => true, 'message' => 'تم حذف المشروع']);
    }
}
