package com.example.clientapp;

import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;
import android.view.View;

import org.json.JSONException;
import org.json.JSONObject;

import java.net.URISyntaxException;

import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;

public class GameActivity extends AppCompatActivity {

    private Socket mSocket;
    private static final String LOG_TAG = "GameActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_game);
        Bundle extras = getIntent().getExtras();

        assert extras != null;
        String username = extras.getString("username");
        String roomid = extras.getString("roomid");

        try {
            mSocket = IO.socket("http://10.137.26.99:3000/");
            mSocket.connect();
            mSocket.on("heartBeat", sendPong);

            tryToConnect(username, roomid);

            // Check if the room is available and
            mSocket.on("login_confirm", confirmLogin);

            if(mSocket.connected()){
                Log.d(LOG_TAG, username + "connected");
            }else {
                Log.d(LOG_TAG, username + "not connected");
            }
        } catch (URISyntaxException e) {
            e.printStackTrace();
            Log.d(LOG_TAG, "connection error");
        }
    }

    private void tryToConnect(String username, String roomid) {
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("username", username);
            jsonObject.put("roomid", roomid);
            mSocket.emit("client_new", jsonObject);
        }catch(JSONException e) {
            e.printStackTrace();
        }
    }

    public void onDestroy() {
        super.onDestroy();
        mSocket.disconnect();
    }

    private Emitter.Listener confirmLogin = new Emitter.Listener() {
        @Override
        public void call(final Object... args) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Boolean data = (Boolean) args[0];
                    if(data){
                        // Display HUD
                        View hud = findViewById(R.id.btn_action1);
                        hud.setVisibility(Integer.parseInt("visible"));
                    }else {
                        mSocket.disconnect();
                        finish();
                    }
                }
            });
        }
    };

    private Emitter.Listener sendPong = new Emitter.Listener() {
        @Override
        public void call(final Object... args) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    mSocket.emit("pong", "pong");
                }
            });
        }
    };



    public void actionOne(View view) {
        mSocket.emit("test", "test");
        Log.d(LOG_TAG, "send msg");
    }

    public void actionTwo(View view) {

    }
}
