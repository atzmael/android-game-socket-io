package com.example.clientapp;

import android.os.Bundle;
import android.support.v4.app.FragmentActivity;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentTransaction;
import android.widget.EditText;

import org.json.JSONException;
import org.json.JSONObject;

import io.socket.client.Socket;
import io.socket.emitter.Emitter;

import static android.graphics.Color.parseColor;

public class MainActivity extends FragmentActivity implements Login.OnFragmentInteractionListener, GameController.OnFragmentInteractionListener {

    // Socket init
    private Socket mSocket;

    // Var init
    private static final String LOG_TAG = "GameActivity";
    public static final String EXTRA_MESSAGE = "com.example.android.mainactivity.extra.MESSAGE";
    public static final int TEXT_REQUEST = 1;

    // Player stats color
    final int playerLifeNumber = 3;
    final Boolean[] powerup = null;
    private String playerUsername;
    private int playerColor;

    // Game stats
    private int nbPlayer = 0;

    private FragmentManager fragmentManager;

    // Touch position for pad controller
    JSONObject client_position = new JSONObject();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        if (savedInstanceState == null) {
            FragmentManager manager = getSupportFragmentManager();
            FragmentTransaction transaction = manager.beginTransaction();
            transaction.replace(R.id.fragment_container, new Login());
            transaction.commit();
        }
    }

    public Socket getSocket() {
        return mSocket;
    }

    public void setSocket(Socket socket) {
        this.mSocket = socket;
    }


    /**
     * Connection handler
     **/

    public Emitter.Listener confirmLogin = new Emitter.Listener() {
        @Override
        public void call(final Object... args) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    JSONObject data = (JSONObject) args[0];

                    boolean confirm = false;

                    try {
                        confirm = data.getBoolean("confirm");
                        playerColor = parseColor(data.getString("color"));
                    } catch (JSONException e) {
                        e.printStackTrace();
                    }

                    if (confirm) {
                        EditText mField = findViewById(R.id.username);
                        playerUsername = mField.getText().toString();
                        FragmentManager manager = getSupportFragmentManager();
                        FragmentTransaction transaction = manager.beginTransaction();
                        transaction.replace(R.id.fragment_container, new GameController());
                        transaction.commit();
                    } else {
                        mSocket.disconnect();
                    }
                }
            });
        }
    };

    public void backHome() {
        FragmentManager manager = getSupportFragmentManager();
        FragmentTransaction transaction = manager.beginTransaction();
        transaction.replace(R.id.fragment_container, new Login());
        transaction.commit();
        mSocket.disconnect();
    }

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



    @Override
    public void onFragmentInteraction() {
    }

    // GETTEUR
    public int getPlayerColor() {
        return playerColor;
    }

    public String getPlayerUsername() {
        return playerUsername;
    }

    public int getPlayerLifeNumber() {
        return playerLifeNumber;
    }
}
