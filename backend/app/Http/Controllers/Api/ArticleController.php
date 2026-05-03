<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ArticleController extends Controller
{
    public function index()
    {
        $articles = Article::latest()->get();
        return response()->json([
            'success' => true,
            'data' => $articles
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => 'required|string|max:100',
            'image' => 'nullable|string',
            'author' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $article = Article::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Article created successfully!',
            'data' => $article
        ], 201);
    }

    public function show($slug)
    {
        $article = Article::where('slug', $slug)->firstOrFail();
        return response()->json([
            'success' => true,
            'data' => $article
        ]);
    }

    public function update(Request $request, $id)
    {
        $article = Article::findOrFail($id);
        $article->update($request->only(['title', 'content', 'category', 'image', 'author']));

        return response()->json([
            'success' => true,
            'message' => 'تم تعديل المقال بنجاح',
            'data' => $article
        ]);
    }

    public function destroy($id)
    {
        $article = Article::findOrFail($id);
        $article->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف المقال بنجاح'
        ]);
    }
}

